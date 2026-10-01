// ══════════════════════════════════════════════════════════════════════
// tr/castle/cover.js — the alibi, the deflection, the plant. Traitor-only.
// ══════════════════════════════════════════════════════════════════════
//
// ROLE OVERRIDES ARCHETYPE (spec §5.9). CLAUDE.md's "nice archetypes never
// scheme" rule describes what someone WOULD choose to do; it does not
// describe what a person forced to lie every day is capable of once the
// role has already been assigned to them. Every weight() below gates on
// `alignmentAt(name, ep) === 'traitor'` — role, i.e. permission — and NEVER
// on archetype. Archetype only ever appears inside fire(), to score
// COMPETENCE at a cover story the role already grants. A hero who accepted
// recruitment runs `cover-story-check` exactly like a schemer does; they are
// just visibly worse at it, which is the point, not a bug to route around.
//
// No belief writes. Cover is the Traitors' half of a channel — what a room
// eventually believes about a planted name is a suspicion.js /
// deduction.js question, earned through gateChannel(), not decided here.
import { gs, players } from '../../core.js';
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import { findOpenThread, priorMoments } from '../threads.js';
import { alignmentAt, livingFaithfuls } from '../roles.js';
import { knowsAlignmentOf } from '../deduction.js';

const FAMILY = 'cover';
/**
 * Lines that do not need a partner, when there is no partner to name — and the
 * whole pool when none of them can avoid it. `pick` draws once either way, so
 * this does not perturb the rng.
 */
function _partnerSafe(pool, partner) {
  if (partner) return pool;
  const safe = pool.filter(l => !l.includes('{b}'));
  return safe.length ? safe : pool;
}


/**
 * Re-capitalise the start of every sentence.
 *
 * FOUND BY READING OUTPUT (Plan 5 Task 4 round 2). Three events fill an absent
 * partner with the stand-in "somebody" - the substitution the source rule in
 * tr-castle-reachability.test.js requires, because DELETING the clause leaves a
 * fragment. When `{b}` happens to open a sentence, the stand-in opens it in
 * lower case: "Carrie didn't hide how hard it hit them. somebody sat with them
 * and let it be quiet for a while." Every authored line already begins with a
 * capital, so this is a no-op on all of them and only ever fixes a stand-in.
 */
export function _sentenceCase(line) {
  return String(line).replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}

/** Fill both tokens. An absent partner becomes an unnamed onlooker, never a hole. */
function _fillPartner(line, a, partner) {
  return _sentenceCase(pronounSlots(line.replace(/\{a\}/g, a).replace(/\{b\}/g, partner || 'somebody'),
    { a, b: partner || '' }));
}

import { lineFor, whoTheyTold, pronounSlots } from './lines.js';

const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

// THE CONCRETE THING A COVER STORY IS ABOUT — the most recent murder, named,
// which is the night a Traitor most needs an account for. Read from the exit
// records of already-played episodes (which include night one, unlike the round
// log) and then the round log for a within-episode kill. A PURE READ: no rng,
// no state write, so the firing stream is bit-identical. Before any murder has
// happened (the first day), the Traitor is covering the one thing they cannot
// say — that they are a Traitor — so the fallback names that.
function _accountTopic() {
  const rows = gs?.episodeHistory || [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const exits = (rows[i] && (rows[i].exits || rows[i].tr?.exits)) || [];
    for (let j = exits.length - 1; j >= 0; j--) {
      if (exits[j] && exits[j].channel === 'murder' && exits[j].name) {
        return `the night ${exits[j].name} was murdered`;
      }
    }
  }
  const rounds = gs?.tr?.rounds || [];
  // not tonight's: that murder is the conclave's, and the conclave is shown
  // after the night (see `_lastGone` in grief.js)
  const done = rows.length;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i] && rounds[i].murdered && !(rounds[i].ep > done)) return `the night ${rounds[i].murdered} was murdered`;
  }
  // NOT "what they really are": that printed singular they over players the
  // roster gives a gender, and read as a riddle. On day one the thing a
  // Traitor has to account for is the line on the gravel.
  return 'the blindfolds';
}

// ── REWRITE (Task 7 stage 5). Fourth on the blame table. The audit's verdict
// was MERGE (into `cover-rehearsed-story-advance`) and also recorded that it
// "writes NO effects at all"; both are fixed here rather than by deletion,
// because `morning` is one of the windows this stage owes events to and the
// two premises fork differently once either of them has a fork.
//
// ANSWERING A QUESTION NOBODY ASKED IS A RISK, and the old version treated it
// as free. Four outcomes, scored the way cover.js scores everything else:
//
//   alibi-built   — the detail is small, dull and unanswerable, and it lands
//                   as nothing at all.
//   asked-for-it  — nobody had raised it. Raising it yourself makes it a
//                   subject, and now somebody in the room is holding it.
//   too-specific  — the account has a time in it that nobody needed, and a
//                   time is a thing that can be checked.
//   held-it-back  — {a} had the account ready and read the room and did not
//                   use it, which is the branch that costs nothing and is
//                   therefore the hardest to choose.
//
// OBSERVER SAFETY IS UNCHANGED: the gate reads the ACTING PLAYER'S OWN role,
// no belief is written, and `{b}` on the two branches that have one is drawn
// from the living room rather than from the pact.
const PREEMPTIVE_LINES = {
  'alibi-built': [
    '{a} mentions where {aSub} was last night before anybody has asked.\n{a}: "I was up at half ten, I was knackered. Did anyone else hear the door go?"\n{a} (to camera): {cam:story-hold}',
    '{a} works {aPos} evening into the breakfast chat, casually.\n{a}: "I was in bed so early last night. Honestly, I was out cold."\n{a} (to camera): {cam:story-hold}',
    '{a} gets {aPos} version of last night out before anyone can ask.\n{a} (to camera): "Get your story out first. Then it’s the story, not the answer to a question."',
    '{a} tells {b} where {aSub} was last night, unprompted.\n{a}: "I was in bed by eleven, by the way. Just so you know."\n{b}: "Okay. I didn’t ask."\n{a} (to camera): {cam:story-hold}',
  ],
  'asked-for-it': [
    '{a} answers a question nobody has asked, in front of {b}.\n{a}: "Before anyone asks, I was in my room all night."\n{b}: "Nobody asked, {a}."\n{a} (to camera): "Why did I say that? Nobody asked. Now it looks like I was waiting for it."',
    '{a} mentions last night, unprompted, and then has to live with having mentioned it.\n{a} (to camera): {cam:story-close}',
    '{a} explains {aPos} evening to {b}, who never asked about it.\n{a}: "…and then I read for a bit, and then lights out."\n{b}: "Why are you telling me this?"\n{a} (to camera): "Too keen. Much too keen. Idiot."',
    '{a} offers an alibi at breakfast, out of nowhere.\n{a} (to camera): {cam:story-close}',
  ],
  'too-specific': [
    '{a} puts an exact time on {aPos} evening, which nobody asked for.\n{a}: "I was asleep by ten forty. Ten forty-five, tops."\n{a} (to camera): "Why did I give a time? A time can be checked."',
    '{a} gives far too much detail about last night.\n{a} (to camera): {cam:story-close}',
    '{a} tells {b} exactly when {aSub} went to bed, to the minute.\n{a}: "Eleven forty. On the dot."\n{b}: "That’s very precise."\n{a} (to camera): "Nobody remembers the time they went to bed. I just did. Out loud."',
    '{a}’s story has a clock in it. That’s a mistake, and {a} knows it.\n{a} (to camera): {cam:story-close}',
  ],
  'held-it-back': [
    '{a} comes down with {aPos} story ready, and nobody asks.\n{a} (to camera): {cam:story-fine}',
    '{a} has a whole account ready at breakfast, and doesn’t use a word of it.\n{a} (to camera): "Nobody asked. I didn’t offer. That’s how it should be."',
    '{a} keeps {aPos} alibi in {aPos} pocket and lets the room talk about something else.\n{a} (to camera): {cam:story-hold}',
    '{a} decides not to bring up last night unless someone else does.\n{a} (to camera): "You don’t answer questions nobody’s asking."',
  ],
};

registerEvent({
  id: 'cover-preemptive-alibi',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `cover|morning` held no advancer. An
  // account is the one thing in the castle that is EXPLICITLY cumulative
  // — its whole risk is that it has to keep matching what was already said —
  // so a Traitor building the next layer of one names the day they laid the
  // last. This is a solo arc: the party set is the Traitor alone.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
    voice: ['social', 'strategic', 'intuition'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-preemptive-alibi');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const room = (ctx.living || []).filter(n => n !== actor);
    const other = room.length ? pick(rng, room) : null;
    const st = pStats(actor);
    const archetype = players.find(p => p.name === actor)?.archetype || 'floater';
    const clumsy = NICE_ARCHETYPES.includes(archetype);
    const scores = {
      'alibi-built': (st.social / 10) * 0.4 + (st.strategic / 10) * 0.3 + (clumsy ? -0.12 : 0.1),
      'asked-for-it': other ? (1 - st.social / 10) * 0.35 + (clumsy ? 0.25 : 0.05) : 0,
      'too-specific': other ? (1 - st.temperament / 10) * 0.35 + (st.mental / 10) * 0.15 : 0,
      'held-it-back': (st.intuition / 10) * 0.4 + (st.temperament / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'asked-for-it' ? 'made a subject of something nobody had raised'
      : branch === 'too-specific' ? 'put a time on it that nobody had asked for'
        : branch === 'held-it-back' ? 'had the account ready and did not use it'
          : 'had an account of the night ready before anybody asked';
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep,
      lineFor(PREEMPTIVE_LINES[branch], `cover-preemptive-alibi|${branch}|${ctx.ep}`,
        { a: actor, b: other || 'somebody' }), { source: sceneWhy });
    let bondDelta = 0;
    if ((branch === 'asked-for-it' || branch === 'too-specific') && other) {
      bondDelta = branch === 'too-specific' ? -1 : -0.5;
      api.addBond(actor, other, bondDelta, { source: sceneWhy });
    }
    const out = { branch, topic: _accountTopic(), topicKind: 'cover-account', actor, threadId: thread?.id, cited, bondDelta };
    if (other && bondDelta) { out.pair = [actor, other]; out.speaker = actor; out.respondent = other; }
    if (branch === 'too-specific') out.crowd = { name: actor, colour: 'exposed', mult: 0.4 };
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`sacrificed-ally`) —
// the fork is in the wording." Spending your own partner in front of a room is
// the biggest move this family has and it always worked, which — as stage 5
// wrote of `cover-plant-a-name` — is not a move.
//
// THE RECORD THE FORK READS is what {a} KNOWS, never what {b} IS: the weight
// already requires `knowsAlignmentOf(a, b)`, and the fork adds the stored bond
// between them and {b}'s own temperament and strategic. No belief is written
// on any branch; a staged suspicion proves nothing and must not reach the
// deduction layer as though it did.
const SACRIFICE_ALLY_LINES = {
  'sacrificed-ally': [
    '{a} names {b} in front of the room, on purpose, to clear them both.\n{a}: "I’m not saying it’s {b}. But {b} was very quiet at the last table."\n{b}: "Are you serious?"\n{b} (to camera): "{a} just threw me under the bus. I know why. I still hate it."',
    '{a} throws suspicion at {b}, {aPos} own ally, to look like a hunter.\n{a}: "Honestly? I’d look at {b}."\n{b}: "Me? You’re joking."\n{a} (to camera): "Nobody thinks you’d point at your own. That’s why it works."',
    '{a} brings up {b}’s name at dinner.\n{a}: "Has anyone else noticed {b}’s been a bit off?"\n{b}: "Off how, exactly?"\n{b} (to camera): "Thanks, {a}. Thanks a lot."',
    '{a} sacrifices a bit of {b}’s standing to save {aPos} own.\n{a}: "I’m only saying, {b} did go very quiet last night."\n{b}: "Thanks, {a}."\n{a} (to camera): {cam:steer}',
  ],
  'played-along': [
    '{a} names {b}, and {b} plays along perfectly.\n{a}: "I’m just not sure about {b}."\n{b}: "Me? Seriously? After everything?"\n{b} (to camera): "I knew exactly what {a} was doing. I gave them a show."',
    '{b} sees what {a} is doing and defends {bRef} badly, on purpose.\n{b}: "I— that’s not— I don’t know what to say."\n{a}: "See? Can’t even answer."\n{a} (to camera): "{b} got it straight away. Brilliant."',
    '{a} and {b} put on a little argument for the room.\n{b}: "You’ve got some nerve, {a}."\n{a}: "Just saying what I see."\nLater, alone, neither of them mentions it.',
    '{b} takes the accusation from {a} and makes it look real.\n{a}: "I’m sorry, but I have to say it. I don’t trust {b}."\n{b}: "I… I don’t know what to say to that."\n{b} (to camera): "If {a} suspects me, nobody thinks we’re together. Clever. Painful. Clever."',
  ],
  'would-not-take-it': [
    '{a} names {b} in front of the room, and {b} refuses to go along with it.\n{b}: "No. I’m not having that. Where’s this coming from, {a}?"\n{a}: "I’m just asking questions."\n{b}: "Ask them about yourself."',
    '{b} won’t be the sacrifice.\n{b}: "Don’t you dare put this on me."\n{a}: "I’m only asking a question."\n{a} (to camera): "{b} didn’t play along. Now I’ve got a problem."',
    '{b} turns it straight back at {a}.\n{b}: "Funny, {a}, because I was going to say the same about you."\n{a}: "Go on, then."',
    '{b} flatly refuses to be used.\n{a}: "I think we should look at {b}."\n{b}: "No. I’m not your shield, {a}."\n{b} (to camera): "{a} thought I’d just take it. I won’t."',
  ],
  'the-room-kept-it': [
    '{a} pointed the room at {b} for one evening. The room has decided to keep {b}.\n{a} (to camera): "I only meant for it to last a night. Now they won’t leave {b} alone."',
    'It worked too well. The room is still on {b} days later.\n{a} (to camera): "I started it. I can’t stop it. {b}’s in real trouble now."',
    'The suspicion {a} put on {b} has stuck.\n{b}: "Why does everyone keep looking at me?"\n{a}: "No idea."\n{a} (to camera): "I have every idea."',
    '{a} can’t call the room off {b}.\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'cover-suspect-own-ally',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['strategic', 'temperament', 'boldness'],
    alignment: ['traitor'],
    relationship: ['close-ally'],
  },
  // ACT: TESTING. Throwing your own ally to the room to clear both names
  // needs a room already hunting somebody (so not the first days) and a
  // partner still alive to spend (so not the last). The measured centre of
  // gravity agreed before this was declared: 2 firings early, 6 middle, 1
  // late per 400 seasons.
  acts: { early: 0.6, middle: 1.5, late: 0.7 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // The pact is read through what `a` KNOWS, not through what `b` IS — see
    // the note on cover-swap-story-with-partner.
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-suspect-own-ally');
    const [a, b] = ctx.actors;
    const sb = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      'sacrificed-ally': 0.4,
      'played-along': (sb.strategic / 10) * 0.3 + Math.max(0, bond) * 0.05,
      'would-not-take-it': (1 - sb.temperament / 10) * 0.3 + Math.max(0, 0.2 - Math.max(0, bond) * 0.03),
      'the-room-kept-it': (1 - sb.social / 10) * 0.25 + 0.1,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'sacrificed-ally';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'played-along' ? 'was spent in public and played the part'
      : branch === 'would-not-take-it' ? 'refused to be the material for somebody else’s evening'
        : branch === 'the-room-kept-it' ? 'pointed the room at an ally and could not call it off'
          : 'pointed the room at their own ally';
    const note = lineFor(SACRIFICE_ALLY_LINES[branch], `cover-suspect-own-ally|${branch}|${ctx.ep}`, { a, b });
    // The misdirection is real strategy, but the FRICTION it creates is real
    // too — publicly turning on your own ally costs something even when it
    // is staged, which is why every branch still moves the bond down.
    const bondDelta = branch === 'played-along' ? -0.5
      : branch === 'would-not-take-it' ? -2.5
        : branch === 'the-room-kept-it' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, topic: b, topicKind: 'cover-deflect', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 5). Ninth on the blame table. The audit’s verdict
// was REWRITE ("one branch — the fork is in the wording"), and the reason it
// mattered is that this is the Traitor’s signature evening move and it always
// worked. A move that always works is not a move.
//
// FOUR OUTCOMES, SCORED THE WAY cover.js SCORES A LIE — social and strategic
// against noise, with a nice archetype dragged into the role paying for it:
//
//   it-took            — the name is in the room by bedtime and nobody can
//                        say where it came from.
//   too-obvious        — three mentions in one evening is three mentions, and
//                        {b} noticed the count rather than the name.
//   came-back-round    — it worked so well it came back to {a} from somebody
//                        else, which is a Traitor’s favourite hour and also
//                        the moment the story stops being controllable.
//   thought-better-of-it — {a} set it up, looked at the room, and did not
//                        spend it tonight.
//
// OBSERVER SAFETY IS UNCHANGED. The gate reads the ACTING PLAYER’S OWN
// alignment and nothing else, the target is drawn from `livingFaithfuls` as
// before, and NO BELIEF IS WRITTEN by any branch: the plant proves nothing and
// must not read to the deduction layer as evidence of anything. `{b}` on the
// two branches that have one is drawn from the living room, not from the pact.
const PLANT_NAME_LINES = {
  'it-took': [
    '{a} works {c}’s name into three separate conversations today.\n{a}: "Has anyone else noticed {c} always changes the subject?"\n{a} (to camera): {cam:steer}',
    'By evening, four people have heard {c}’s name from {a}, and none of them noticed where it came from.\n{a} (to camera): {cam:steer}',
    '{a} mentions {c} to {b}, lightly.\n{a}: "I’m not saying anything. I’m just saying watch {c}."\n{a} (to camera): "That’s all it takes. One sentence."',
    '{a} gets {c}’s name going round the castle.\n{a} (to camera): "{c}’s the name tonight. They just don’t know it yet."',
  ],
  'too-obvious': [
    '{a} brings up {c}’s name too many times, and {b} notices.\n{b}: "That’s the third time you’ve said {c} today."\n{a}: "Is it? I didn’t realise."\n{a} (to camera): {cam:story-close}',
    '{a} pushes {c}’s name too hard.\n{a}: "I’m just saying, {c}, {c}, {c}. Every time."\n{b}: "You’ve said {c}’s name four times."\n{b} (to camera): "{a} really wants us looking at {c}. Why?"',
    '{a} keeps coming back to {c}, and it starts to look like a campaign.\n{b}: "You really don’t like {c}, do you?"\n{a}: "I just have a feeling."',
    '{a} overplays it.\n{a} (to camera): "I said {c} too many times. Now they’re looking at me looking at {c}."',
  ],
  'came-back-round': [
    'An hour after {a} planted it, someone tells {a} about {c}, in almost {a}’s own words.\n{b}: "I’m telling you, watch {c}. Something’s off."\n{a}: "Really? I hadn’t thought about it."\n{a} (to camera): "I thought about it. I started it."',
    '{a} hears {c}’s name come back to {aObj}, improved.\n{a} (to camera): {cam:steer}',
    '{b} tells {a} {bPos} brilliant new theory about {c}.\n{a}: "Oh, that’s interesting. You might be right."\n{b}: "I worked it out myself."\n{a} (to camera): "Of course I might be right. It’s my theory."',
    '{c}’s name has done the rounds and come back to {a}.\n{a} (to camera): "Full circle. Perfect."',
  ],
  'thought-better-of-it': [
    '{a} has {c}’s name ready all evening, and doesn’t use it.\n{a} (to camera): "Not tonight. The room’s not ready for it."',
    '{a} reads the room and decides tonight isn’t the night.\n{a} (to camera): {cam:story-hold}',
    '{a} nearly mentions {c} to {b}, then talks about the food instead.\n{a}: "Lovely stew tonight."\n{a} (to camera): "Timing is everything. Tonight’s the wrong time."',
    '{a} holds back.\n{a} (to camera): "Push a name too early and it points back at you."',
  ],
};

registerEvent({
  id: 'cover-plant-a-name',
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
    voice: ['social', 'strategic', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor && livingFaithfuls(ctx.ep).length ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-plant-a-name');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const pool = livingFaithfuls(ctx.ep).filter(n => n !== actor);
    const target = pick(rng, pool.length ? pool : livingFaithfuls(ctx.ep));
    const room = (ctx.living || []).filter(n => n !== actor && n !== target);
    const other = room.length ? pick(rng, room) : null;
    const st = pStats(actor);
    const archetype = players.find(p => p.name === actor)?.archetype || 'floater';
    const clumsy = NICE_ARCHETYPES.includes(archetype);
    const scores = {
      'it-took': (st.social / 10) * 0.45 + (st.strategic / 10) * 0.35 + (clumsy ? -0.15 : 0.1),
      'too-obvious': other ? (1 - st.social / 10) * 0.4 + (clumsy ? 0.3 : 0.05) : 0,
      'came-back-round': other ? (st.social / 10) * 0.4 + (st.boldness / 10) * 0.2 : 0,
      'thought-better-of-it': (st.intuition / 10) * 0.35 + (1 - st.boldness / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'too-obvious' ? 'said one name once too often'
      : branch === 'came-back-round' ? 'had the name come back from somebody else'
        : branch === 'thought-better-of-it' ? 'had the name ready and did not use it'
          : 'put somebody else’s name into the room';
    // Residue only — NOT a belief. This is the setup a later suspicion.js
    // event can pick up on ("why does everyone keep saying that name?"); the
    // plant itself proves nothing and must not read as evidence of anything
    // to the deduction layer.
    // ── HOW FAR IT ACTUALLY GOT (writing-contracts.md, "Evidence for group
    //    consensus") ─────────────────────────────────────────────────────
    //
    // The `came-back-round` branch used to assert that the name had gone round the whole castle, and wrote no
    // receipt to say so. The news now travels to named people (`whoTheyTold`
    // — chosen by bond, no rng draw) with a propagation hop each, and the
    // sentence takes its words from `api.consensusPhrase`, which is only
    // allowed to say "the people still in the castle" once the receipts pass
    // the consensus floor. Below the floor it names them or counts them.
    let who = 'a few people';
    if (branch === 'came-back-round' && other) {
      const factId = api.recordClaim(actor, `${actor} put ${target}'s name into the room`,
        { about: target, listeners: [other], channel: 'conversation', source: sceneWhy }).id;
      for (const to of whoTheyTold(other, [actor, other], ctx.living, 5)) {
        api.propagate(factId, other, to,
          { channel: 'conversation', source: `${target}'s name was passed on to ${to}` });
      }
      who = api.consensusPhrase({ factId });
    }
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy,
      seed: lineFor(PLANT_NAME_LINES[branch], `cover-plant-a-name|${branch}|${ctx.ep}`,
        { a: actor, b: other || 'somebody', c: target, who }) });
    let bondDelta = 0;
    if (branch === 'too-obvious' && other) {
      bondDelta = -1;
      api.addBond(actor, other, bondDelta, { source: sceneWhy });
    } else if (branch === 'came-back-round' && other) {
      bondDelta = 0.5;
      api.addBond(actor, other, bondDelta, { source: sceneWhy });
    }
    const out = { branch, topic: target, topicKind: 'cover-deflect', actor, target, threadId: t?.id, bondDelta };
    if (other && bondDelta) { out.pair = [actor, other]; out.speaker = actor; out.respondent = other; }
    // A Traitor putting an innocent name in the room’s mouth. `cruel` for what
    // it does to the target and `masterful` for how well it is done — the two
    // ledgers are the only way to say both at once. See js/tr/crowd.js.
    // NEITHER IS PAID ON THE TWO BRANCHES WHERE IT DID NOT LAND: nothing
    // happened to the target on `thought-better-of-it`, and `too-obvious` is
    // the opposite of masterful, so it takes `exposed` instead.
    if (branch === 'it-took' || branch === 'came-back-round') {
      out.crowd = [{ name: actor, colour: 'cruel', mult: 0.5 },
        { name: actor, colour: 'masterful' }];
    } else if (branch === 'too-obvious') {
      out.crowd = { name: actor, colour: 'exposed', mult: 0.5 };
    }
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`rehearsed`) — the fork
// is in the wording." It is a solo, high-firing `dawn` event, which is the
// worst combination in the pool for repetition: one branch means one pool for
// every firing a season contains, and it sat in the top five of the blame
// table for three batches running.
//
// THE RECORD THE FORK READS is the cover arc's own length — `priorMoments`,
// how many mornings this account has already been over — and the actor's
// mental and temperament. A story told for the second time and a story told
// for the fifth are different objects, and only the second of those is a risk
// the teller can hear.
const REHEARSED_LINES = {
  rehearsed: [
    '{a} tells {aPos} story about last night again, word for word.\n{a} (to camera): {cam:story-hold}',
    '{a} gives the same account a second time, without changing a thing.\n{a} (to camera): "Same words, same order. If it changes, that’s when they notice."',
    '{a} runs through {aPos} version of events for the third time today.\n{a} (to camera): {cam:story-hold}',
    '{a} has told the story so many times it’s smooth.\n{a} (to camera): "It sounds true now. Even to me."',
  ],
  'roughed-it-up': [
    '{a} gets a small detail wrong on purpose.\n{a} (to camera): "Nobody remembers a night perfectly. So I don’t either. On purpose."',
    '{a} adds a hesitation to {aPos} story, in the same place every time.\n{a} (to camera): {cam:story-hold}',
    '{a} makes {aPos} story a bit messier.\n{a} (to camera): "Perfect sounds rehearsed. Messy sounds real."',
    '{a} leaves a little gap in the account.\n{a} (to camera): "A real memory has holes. Mine needs some."',
  ],
  'heard-themselves': [
    '{a} is halfway through {aPos} story when {aSub} hears it for what it is: a performance.\n{a} (to camera): {cam:story-close}',
    '{a} tells the story too smoothly and can’t fix it mid-sentence.\n{a} (to camera): "That came out like a script. Because it is one."',
    '{a} hears {aPos} own voice and doesn’t like it.\n{a} (to camera): "I sounded like I was reading it."',
    '{a} gets through the story and feels sick.\n{a} (to camera): {cam:story-close}',
  ],
  'changed-it': [
    '{a} changes a detail in {aPos} story, and two people now have the old version.\n{a} (to camera): {cam:story-close}',
    '{a} moves {aPos} evening half an hour later this morning.\n{a} (to camera): "Two versions of the same night going round. That’s dangerous."',
    '{a} tweaks the story and immediately regrets it.\n{a} (to camera): "Why did I change it? It was fine!"',
    '{a} updates the account, and hopes nobody compares notes.\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'cover-rehearsed-story-advance',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // The thread is on the ACTOR, not the scene — see _threadThisEventWouldAdvance.
  threadScope: 'solo',
  // CITES (Plan 5 Task 2). "The same story again" is a claim ABOUT an earlier
  // day, and the day is the only thing that makes it a risk.
  citesResidue: true,
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'backfire'],
    voice: ['mental', 'temperament', 'intuition'],
    alignment: ['traitor'],
    knowledge: ['incomplete'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return findOpenThread(FAMILY, [actor]) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-rehearsed-story-advance');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = findOpenThread(FAMILY, [actor]);
    const st = pStats(actor);
    // HOW MANY MORNINGS THIS ACCOUNT HAS ALREADY HAD, off the stored arc.
    const times = priorMoments(t, ctx.ep).length;
    const scores = {
      rehearsed: Math.max(0.15, 0.55 - times * 0.08),
      'roughed-it-up': (st.strategic / 10) * 0.3 + Math.min(3, times) * 0.08,
      'heard-themselves': (st.intuition / 10) * 0.25 + Math.min(4, times) * 0.07,
      'changed-it': (1 - st.mental / 10) * 0.3 + (1 - st.temperament / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'rehearsed';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'roughed-it-up' ? 'put a deliberate mistake back into a perfect account'
      : branch === 'heard-themselves' ? 'heard their own account and knew it was a performance'
        : branch === 'changed-it' ? 'improved an account that two people already had'
          : 'went over their account of the night again';
    const note = lineFor(REHEARSED_LINES[branch], `cover-rehearsed-story-advance|${branch}|${ctx.ep}`,
      { a: actor });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, note, { source: sceneWhy });
    return { branch, topic: _accountTopic(), topicKind: 'cover-account', actor, threadId: thread?.id, cited };
  },
});
const COLD_SWEAT_LINES = {
  pressed: [
    'Somebody asks {a} a harmless question, and {a} answers it like an accusation.\n{a} (to camera): "My name was on the table last night. Every question feels like a trap now."',
    '{a} breaks a sweat over an ordinary question.\n{a} (to camera): {cam:story-close}',
    '{a} takes a beat too long to answer something simple.\n{a} (to camera): "After last night’s votes, I’m jumpy. And jumpy looks guilty."',
    '{a} fumbles a simple answer at dinner.\n{a} (to camera): {cam:story-close}',
  ],
  calm: [
    '{a} takes a beat too long over something routine, and knows it.\n{a} (to camera): {cam:story-close}',
    '{a} breaks a small sweat on an ordinary question.\n{a} (to camera): "Nobody’s even suspicious of me. So why am I sweating?"',
    '{a} goes a bit red at the wrong moment.\n{a} (to camera): "Pull yourself together."',
    '{a} stumbles on a simple answer.\n{a} (to camera): {cam:story-close}',
  ],
  overexplained: [
    '{a} answers an ordinary question, then answers it again, at length.\n{a} (to camera): "I gave them the whole evening. With times. Nobody asked for times."',
    'Nobody wanted detail. {a} gives loads of it.\n{a} (to camera): {cam:story-close}',
    '{a} explains {aRef} three times more than necessary.\n{a} (to camera): "Guilty people over-explain. I know that. I did it anyway."',
    '{a} talks {aRef} into a corner.\n{a} (to camera): {cam:story-close}',
  ],
  'laughed-it-off': [
    '{a} makes a joke about how guilty {aSub} must look, and it gets a laugh.\n{a}: "Look at me, I’m clearly a murderer."\n{a} (to camera): "Laugh it off. Works every time. Nearly every time."',
    '{a} turns the question into a joke.\n{a} (to camera): {cam:story-fine}',
    '{a} jokes {aPos} way out of a tricky question.\n{a} (to camera): "If they’re laughing, they’re not asking."',
    '{a} laughs, and the room moves on.\n{a} (to camera): {cam:story-fine}',
  ],
  'stopped-talking': [
    'Asked about the night, {a} just stops talking, and the silence is louder than an answer.\n{a} (to camera): {cam:story-close}',
    '{a} freezes when last night comes up.\n{a} (to camera): "I just went blank. Completely blank."',
    '{a} has nothing to say for a beat too long.\n{a} (to camera): {cam:story-close}',
    '{a} goes silent at exactly the wrong moment.\n{a} (to camera): "The worst thing you can do is nothing. And that’s what I did."',
  ],
};

registerEvent({
  id: 'cover-cold-sweat-tell',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'strategic', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    // SPEC 5.3, EMOTIONAL STATE, on the actor's OWN state and their OWN role,
    // which is the one thing a castle event is allowed to know for certain.
    // A Traitor the room actually voted for last night is not composed; a
    // steady one who nobody wrote down has nothing to sweat about yet. Note
    // this WIDENS eligibility rather than only scaling it: pressure does to a
    // calm liar what a low temperament does to a nervous one.
    const nervy = isNervy(ctx.state?.[actor]);
    if (pStats(actor).temperament < 4) return nervy ? 3 : 2;
    return ctx.state?.[actor] === 'desperate' ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-cold-sweat-tell');
    const sceneWhy = 'gave something away while being asked about the night';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const pressed = isNervy(ctx.state?.[actor]);
    const st = pStats(actor);
    // FOUR OUTCOMES, AND THE STATE STILL CHOOSES BETWEEN TWO OF THEM. Somebody
    // the room came for last night sweats differently from somebody it did
    // not, which is what `pressed`/`calm` was for and is kept — it is now the
    // split INSIDE the branch that goes badly rather than the whole fork.
    const scores = {
      tell: (1 - st.temperament / 10) * 0.5 + 0.2,
      overexplained: (1 - st.social / 10) * 0.35 + (st.strategic / 10) * 0.3,
      'laughed-it-off': (st.social / 10) * 0.45 + (st.boldness / 10) * 0.3,
      // A FOURTH THING PRESSURE DOES, and the three above did not cover it:
      // a quiet, guarded player under a question does not sweat, overexplain
      // or perform their way out -- they stop talking, and the stop is the
      // tell. The only fork here that reads LOW social and LOW boldness
      // together, which is the corner `laughed-it-off` leaves empty.
      'stopped-talking': (1 - st.social / 10) * 0.35 + (1 - st.boldness / 10) * 0.25,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'tell';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const pool = branch === 'tell' ? COLD_SWEAT_LINES[pressed ? 'pressed' : 'calm']
      : COLD_SWEAT_LINES[branch];
    const note = lineFor(pool, `cover-cold-sweat-tell|${branch}|${ctx.ep}|${pressed}`, { a: actor });
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: note });
    // THE BRANCH IS THE MOMENT, same rule `cover-alibi-crumbles` states: a
    // recovery the room enjoys is spectacle, a visible tell is exposure.
    // A silence the room reads is exposure of the same kind a visible tell
    // is -- less spectacle, same direction.
    const colour = branch === 'laughed-it-off' ? 'masterful'
      : (branch === 'tell' || branch === 'stopped-talking') ? 'exposed' : null;
    return { branch: branch === 'tell' ? 'tell' : branch, topic: _accountTopic(), topicKind: 'cover-account', actor, threadId: t?.id,
      underPressure: pressed, crowd: colour ? { name: actor, colour } : null };
  },
});

// ── FLAGSHIP: the cover story check — a four-way fork on a COMPETENCE roll
// that role, not archetype, gives everyone equal permission to attempt ──
//
// Permission is checked ONCE, in weight(), on role alone: any living Traitor
// is eligible, full stop. Competence is computed in fire(), from strategic +
// boldness + temperament, with a FLAT PENALTY applied when the actor's
// archetype is one of the "nice" archetypes CLAUDE.md says never scheme.
// That penalty is the whole mechanical expression of "role overrides
// archetype": the hero is not blocked from running this event (archetype
// would say they should be), but their odds of the best outcome are worse
// than a schemer's, every single time it fires.
const OUTCOME_LINES = {
  convincing: [
    '{a} tells a clean, boring, believable story about last night, and the room moves on.\n{a} (to camera): {cam:story-fine}',
    'Whatever {a} says, it lands exactly as ordinary as intended.\n{a} (to camera): {cam:story-fine}',
    '{b} asks {a} about last night.\n{b}: {say:ask-where}\n{a}: {say:answer-clean}\n{b}: "Fair enough."',
    '{a} gets asked, answers calmly, and nobody thinks twice.\n{a} (to camera): {cam:story-fine}',
    '{b} checks {a}’s evening.\n{b}: "Where did you get to last night?"\n{a}: {say:answer-clean}\n{b} nods and moves on.',
  ],
  awkward: [
    '{a}’s story has a wobble in it. Nobody is listening closely enough to catch it.\n{a} (to camera): {cam:story-close}',
    'It isn’t {a}’s best work, but it gets through.\n{a} (to camera): "That was messy. Luckily nobody was paying attention."',
    '{b} asks, and {a} fumbles it a little.\n{b}: {say:ask-where}\n{a}: {say:answer-shaky}\n{b}: "Right. Okay."',
    '{a} gets through the questions, just about.\n{a} (to camera): {cam:story-close}',
    '{a} stumbles on a detail and smooths it over.\n{a} (to camera): "Got away with that. Barely."',
  ],
  suspicious: [
    '{a}’s answer comes half a second too fast, and at least one person notices.\n{a} (to camera): {cam:story-close}',
    '{b} asks {a} where {aSub} was, and {a} is very, very helpful about it.\n{b}: {say:ask-where}\n{a}: {say:answer-shaky}\n{b} (to camera): "Too much. That was too much."',
    '{a} is a bit too keen to answer.\n{a} (to camera): "I answered before they’d finished asking. Rookie mistake."',
    '{a} overdoes the answer, and {b} files it.\n{b}: "Where were you last night?"\n{a}: "Bed by eleven, read for twenty minutes, lights out at twenty past."\n{b} (to camera): "{a} had that answer ready. Nobody has an answer ready."',
    '{a}’s story sounds rehearsed.\n{a} (to camera): {cam:story-close}',
  ],
  slip: [
    '{a} says too much, too fast, and has to walk it back.\n{a}: "I was upstairs — well, downstairs first, then upstairs — does it matter?"\n{a} (to camera): {cam:story-close}',
    'The story falls apart in {a}’s mouth halfway through.\n{a} (to camera): "I lost my own story. In the middle of telling it."',
    '{b} catches {a} out on a detail.\n{b}: "You said the kitchen earlier."\n{a}: "Did I? I meant after. The kitchen after."\n{b} (to camera): "No, you didn’t."',
    '{a} contradicts {aRef} in front of {b}.\n{a}: "I was in the kitchen, then the library— no, the library first."\n{b}: "Which one?"\n{a} (to camera): {cam:story-close}',
    '{a} slips, and knows it.\n{a} (to camera): "One wrong word. That’s all it takes in here."',
  ],
};

registerEvent({
  id: 'cover-story-check',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['boldness', 'strategic', 'temperament'],
  },
  family: FAMILY,
  window: 'evening',
  // ADVANCES AND CITES (Plan 5 Task 2). `cover|evening` held four events and
  // no advancer. Being asked to tell it again IS the event, and what makes
  // the retelling dangerous is the day it has to match.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // ROLE IS THE ONLY GATE. Any living Traitor may attempt this — a hero
    // who took the recruitment is exactly as eligible as a schemer. Nothing
    // here reads archetype; that only happens after eligibility is decided.
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-story-check');
    const sceneWhy = 'had their account of the night checked';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const partner = ctx.actors.find(n => n !== actor) || null;
    const st = pStats(actor);
    const archetype = players.find(p => p.name === actor)?.archetype || 'floater';

    // COMPETENCE, not permission. The nice-archetype penalty is the entire
    // mechanism: it never removes the branch, it only shifts the roll toward
    // the bad outcomes — a hero-turned-Traitor visibly struggling at the
    // exact thing the role now requires of them every single episode.
    let competence = (st.strategic / 10) * 0.4 + (st.boldness / 10) * 0.3 + (st.temperament / 10) * 0.3;
    if (NICE_ARCHETYPES.includes(archetype)) competence -= 0.25;
    competence = Math.max(0.05, Math.min(0.95, competence));

    const convincingScore = competence * 0.5;
    const awkwardScore = 0.3;
    const suspiciousScore = (1 - competence) * 0.35;
    const slipScore = (1 - competence) * 0.25;
    const total = convincingScore + awkwardScore + suspiciousScore + slipScore;
    const roll = rng() * total;
    let branch;
    if (roll < convincingScore) branch = 'convincing';
    else if (roll < convincingScore + awkwardScore) branch = 'awkward';
    else if (roll < convincingScore + awkwardScore + suspiciousScore) branch = 'suspicious';
    else branch = 'slip';

    // NO PARTNER, NO DANGLING CLAUSE (found by reading output, review round 3).
    // This used to strip from `{b}` to the end of the sentence, which is only
    // correct when `{b}` STARTS one. "Something about the way {a} told it made
    // {b} quietly file it away." became "…told it made ." — a sentence ending
    // on its own verb, which Task 2's citations then quoted into later beats.
    // Prefer a line that never mentions a partner; fall back to an unnamed
    // onlooker, which is true (the room is still there) and always grammatical.
    let line = _fillPartner(pick(rng, _partnerSafe(OUTCOME_LINES[branch], partner)), actor, partner);

    const parties = partner ? [actor, partner] : [actor];
    let bondDelta = 0;
    if (branch === 'convincing' && partner) bondDelta = 1;       // sold it together
    else if (branch === 'suspicious' && partner) bondDelta = -1; // partner half-clocked it
    else if (branch === 'slip' && partner) bondDelta = -2;       // partner had to watch it fall apart
    if (bondDelta) api.addBond(actor, partner, bondDelta, { source: sceneWhy });

    const { thread, cited } = arcContinue(api, FAMILY, parties, ctx.ep, line, { source: sceneWhy });
    return { branch, topic: _accountTopic(), topicKind: 'cover-account', actor, partner, archetype, isNiceButTraitor: NICE_ARCHETYPES.includes(archetype),
      competence, threadId: thread?.id, cited, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

const DOUBLE_BLUFF_LINES = {
  'double-bluffed': [
    '{a} tells {b} {aSub} is suspicious of a fellow Traitor, and makes it sound real.\n{a}: "I hate saying it, but I think one of them is someone I trust."\n{b}: "Who?"\n{a}: "I can’t say yet. Not until I’m sure."\n{b} (to camera): "{a} would never point at their own. So {a} can’t be one."\n{a} (to camera): "That’s the idea."',
    '{a} hands {b} a real name from the turret and lets {b} think {bSub} found it.\n{a}: "I keep coming back to one name."\n{b}: "Who?"\n{a}: "You tell me. You’ve seen it too."\n{a} (to camera): "Give them a real one, and they trust you forever. It costs me, though."',
    '{a} casts doubt on {aPos} own partner, to {b}.\n{a}: "Honestly? I don’t trust some of the people I’m closest to."\n{b}: "That’s brave to say."',
    '{a} plays the double bluff on {b}.\n{a}: "I think it might be someone close to me."\n{b}: "That takes guts to say."\n{a} (to camera): {cam:steer}',
  ],
  'overpaid-for-it': [
    '{a} gives {b} a real name, and {b} runs much further with it than {a} wanted.\n{b}: "I’m going to say it at the table tonight."\n{a}: "Maybe wait a day?"\n{a} (to camera): "I’ve made a monster."',
    'It works too well. {b} won’t let go of the name.\n{b}: "I can’t stop thinking about that name."\n{a}: "Let’s not rush it."\n{a} (to camera): {cam:story-close}',
    '{b} is still on the name at bedtime, and {a} can’t steer {bObj} off it.\n{b}: "I’m saying it at the table tomorrow."\n{a}: "Maybe sleep on it."\n{a} (to camera): "I only meant to hint. Now {b}’s on a crusade."',
    '{a} gives {b} too much.\n{b}: "Why would you give me that name?"\n{a}: "Because I trust you."\n{a} (to camera): "I overpaid. That name’s going to cost us."',
  ],
  'asked-back': [
    '{a} names someone to {b}, and {b} asks why.\n{b}: "And why them?"\n{a}: "Just… a feeling."\n{b}: "A feeling. Right."\n{a} (to camera): {cam:story-close}',
    '{b} turns the question round.\n{b}: "What makes you so sure?"\n{a}: "Just a feeling."\n{a} (to camera): "I hadn’t prepared an answer to that. Big mistake."',
    '{b} wants to know where {a}’s suspicion comes from.\n{b}: "Where’s this coming from?"\n{a}: "I just notice things."',
    '{b} questions {a}’s reasons.\n{b}: "Why that name?"\n{a}: "Instinct."\n{b}: "Instinct’s not a reason."\n{b} (to camera): "{a} pointed at someone very specific, with no reason. Why?"',
  ],
  'did-not-take': [
    '{a} puts a real name in front of {b}, and {b} doesn’t want it.\n{b}: "No, I’ve been thinking about someone else entirely."\n{a}: "Who?"\n{b}: "I’ll tell you when I’m sure."\n{a} (to camera): "Fine. Wasted my best card."',
    '{b} won’t be moved.\n{b}: "Nah. You’re barking up the wrong tree there."\n{a}: "If you say so."\n{a} (to camera): "That didn’t land."',
    '{b} has {bPos} own ideas.\n{b}: "Nah. I’ve got my own name."\n{a}: "Fair enough."\n{a} (to camera): "{b}’s stubborn. Maybe that’s good for me."',
    '{b} shrugs off {a}’s suggestion.\n{a}: "Just keep an eye on them."\n{b}: "Nah."\n{a} (to camera): {cam:story-hold}',
  ],
};

registerEvent({
  // ── REWRITE (Task 7 stage 5). One branch on the Traitor’s cleverest
  // evening move, and the branch was always that it worked. Four now, and
  // three of them are ways a true statement costs more than it buys:
  // overpaying, being asked the next question, and simply not being taken.
  //
  // OBSERVER SAFETY IS UNCHANGED, and it is the reason the gate looks the way
  // it does. `{a}` is read for `{a}`’s OWN role; `{b}` is admitted by
  // `knowsAlignmentOf(a, b)` — what {a} KNOWS, not what {b} is — which is the
  // read probes A/B/C in tests/tr-castle.test.js allow. No belief is written
  // by any branch.
  id: 'cover-double-bluff',
  family: FAMILY,
  window: 'evening',
  // The second advancer in `cover|evening`.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
    voice: ['social', 'strategic', 'intuition'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Needs a Traitor in the scene and somebody they know is NOT in the pact
    // to sell it to. Two things this does NOT do: read `b`’s hidden alignment
    // (it reads `a`’s own knowledge of the turret instead), and require that
    // the Traitor happened to be drawn FIRST. The scene sampler orders actors
    // at random, so a positional requirement silently halved this event for
    // no reason anybody could state.
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!a) return 0;
    const b = ctx.actors.find(n => n !== a);
    return b && !knowsAlignmentOf(a, b, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-double-bluff');
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    const sa = pStats(a), sb = pStats(b);
    const scores = {
      'double-bluffed': (sa.social / 10) * 0.45 + (sa.strategic / 10) * 0.3,
      'overpaid-for-it': (sb.boldness / 10) * 0.35 + (sa.boldness / 10) * 0.2,
      'asked-back': (sb.intuition / 10) * 0.5 + (sb.mental / 10) * 0.2,
      'did-not-take': (1 - sa.social / 10) * 0.35 + (sb.temperament / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'overpaid-for-it' ? 'spent a real name and could not steer what it started'
      : branch === 'asked-back' ? 'was asked why that name, and had not prepared one'
        : branch === 'did-not-take' ? 'offered a real name and had it declined'
          : 'raised the suspicion about themselves first';
    const bondDelta = branch === 'double-bluffed' ? 1
      : branch === 'overpaid-for-it' ? 0.5 : branch === 'asked-back' ? -1 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep,
      lineFor(DOUBLE_BLUFF_LINES[branch], `cover-double-bluff|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    // a double bluff is told TO {b}, about {a}'s own side: {b} is the audience, not a target
    const out = { branch, topic: b, topicKind: 'cover-bluff', pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
    // `masterful` only where it was. A move that got asked the next question,
    // or was declined outright, is not a Traitor doing the thing well — and
    // `asked-back` is the one the country enjoys watching go wrong, which is
    // what `exposed` is for. See js/tr/crowd.js.
    if (branch === 'double-bluffed' || branch === 'overpaid-for-it') {
      out.crowd = { name: a, colour: 'masterful' };
    } else if (branch === 'asked-back') {
      out.crowd = { name: a, colour: 'exposed', mult: 0.5 };
    }
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch — the fork is in the
// wording." Stage 2 also found a real defect in it: the actor is re-derived
// from `gs.tr.loyaltyDebt` inside `fire()`, and with no debt in the world the
// actor was `undefined` and the old direct `openThread` opened a story whose
// only party was nothing at all. The scene-API migration made that throw; the
// derivation is now done once and guarded here as well.
//
// THE RECORD THE FORK READS is the debt itself — `gs.tr.loyaltyDebt` holds who
// approached whom and who ACCEPTED (a refusal writes no record; see the note
// on `they-told-it-first` at the event below) — plus the recruiter's own temperament and
// strategic. What a person does with an account nobody has asked for is the
// scene, and there are four things: keep it, use it unprompted, decide the
// having of it is the danger, or find out the other party has been telling it.
const RECRUIT_COVER_LINES = {
  'recruit-story-kept': [
    '{a} has an account ready for where {aSub} was the night of the recruitment offer. Nobody has asked.\n{a} (to camera): {cam:story-hold}',
    '{a} has the story of that night polished and ready.\n{a} (to camera): "Nobody’s asked where I was when the note went under that door. I’m ready if they do."',
    '{a} keeps the story in reserve.\n{a} (to camera): "The less I talk about that night, the better."',
    '{a} goes over {aPos} alibi for the recruitment night again.\n{a} (to camera): {cam:story-hold}',
  ],
  'told-it-unasked': [
    '{a} explains where {aSub} was that night to someone who never asked.\n{a} (to camera): {cam:story-close}',
    'It comes out at breakfast, unprompted.\n{a} (to camera): "Why did I bring that night up? Nobody was thinking about it till I did."',
    '{a} volunteers {aPos} story, and hears it happening.\n{a} (to camera): "Stop talking. Stop talking."',
    '{a} mentions the recruitment night without being asked.\n{a} (to camera): {cam:story-close}',
  ],
  'binned-it': [
    '{a} decides having a story ready is what gets you caught, and drops it.\n{a} (to camera): "No prepared story. If they ask, I’ll just answer."',
    '{a} takes {aPos} story apart and goes in with nothing.\n{a} (to camera): {cam:story-hold}',
    '{a} decides to stop rehearsing.\n{a} (to camera): "Rehearsed sounds guilty. I’m winging it."',
    '{a} lets the story go.\n{a} (to camera): "Less to remember. Less to trip on."',
  ],
  'they-told-it-first': [
    'The person {a} approached has been telling the story all week, and {a} only finds out this morning.\n{a} (to camera): {cam:story-close}',
    '{a} discovers the recruit has already told everyone about the note.\n{a} (to camera): "Great. My perfect story, and someone else has already told theirs."',
    '{a} finds out the story is already out there.\n{a} (to camera): "I need to match whatever they’ve said. Fast."',
    '{a} learns the note is common knowledge.\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'cover-decline-recruit-offer-story',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'backfire', 'accepted'],
    voice: ['temperament', 'strategic', 'intuition'],
    alignment: ['traitor'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const debts = gs.tr?.loyaltyDebt || [];
    const actor = ctx.actors.find(n => debts.some(d => d.recruiter === n));
    return actor ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-decline-recruit-offer-story');
    const debts = gs.tr?.loyaltyDebt || [];
    const actor = ctx.actors.find(n => debts.some(d => d.recruiter === n));
    // WEIGHT AND FIRE MUST AGREE. The weight has already established that one
    // of the scene's actors is a recruiter with a standing debt; if that is
    // somehow untrue here, the honest thing is to say so rather than open a
    // story whose only party is `undefined` — which is precisely what this
    // event used to do (see the header, and stage 2's report).
    if (!actor) throw new Error('cover-decline-recruit-offer-story: no recruiter in scene — weight() and fire() disagree');
    const st = pStats(actor);
    // THE DEBT ITSELF: who refused, and how long ago. Both stored.
    const mine = debts.filter(d => d.recruiter === actor);
    // `recruit`, not `player` -- see the note above this event. The other
    // party to a loyalty debt is the person who ACCEPTED.
    const recruited = mine[0]?.recruit || null;
    const age = Math.max(0, ctx.ep - (mine[0]?.ep ?? ctx.ep));
    const scores = {
      'recruit-story-kept': 0.4 + (st.temperament / 10) * 0.15,
      'told-it-unasked': (1 - st.temperament / 10) * 0.3 + Math.min(3, age) * 0.05,
      'binned-it': (st.intuition / 10) * 0.25 + Math.min(3, age) * 0.06,
      'they-told-it-first': recruited ? 0.15 + (1 - pStats(recruited).loyalty / 10) * 0.25 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'recruit-story-kept';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'told-it-unasked' ? 'gave an alibi nobody had asked for'
      : branch === 'binned-it' ? 'threw away an account rather than carry one'
        : branch === 'they-told-it-first' ? 'found the other half of that night had not kept it'
          : 'explained away the night they were approached';
    const note = lineFor(RECRUIT_COVER_LINES[branch],
      `cover-decline-recruit-offer-story|${branch}|${ctx.ep}`, { a: actor });
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: note });
    // TERMINAL: an account deliberately destroyed is a story that ended
    // without anybody else ever learning it existed.
    if (t && branch === 'binned-it') api.resolveArc(t.id, 'buried', { source: sceneWhy });
    // Same correction as the variable above: the debt records an ACCEPTANCE,
    // so the night in question is the night they said yes.
    return { branch, topic: recruited ? `the night ${recruited} said yes` : 'the night they made their offer', topicKind: 'cover-account', actor, threadId: t?.id };
  },
});
// ── WIDENED AND REFORKED (Task 7 stage 6). A KEEP-list event, and the second
// demonstration in this stage of why a KEEP was never "no work": three
// branches with FOUR-line pools, on a `rare`-amplified `after-table` event, put
// `holds` in the top five of the repetition blame table in three consecutive
// batches. Five branches now and ten lines each.
//
// THE TWO ADDED BRANCHES ARE THE TWO THINGS AN ALIBI CAN DO that "hold /
// wobble / collapse" cannot express: it can be checked against somebody else's
// account rather than against the teller, and it can be abandoned by the
// teller before it is broken. The record they read is the cover arc's own
// length — how many days this account has been in the room — plus the actor's
// stats, all stored.
const ALIBI_CRUMBLE_LINES = {
  holds: [
    '{a}’s story gets a real question, and holds.\n{a} (to camera): {cam:story-fine}',
    'Someone tries to pick at {a}’s alibi. It doesn’t give.\n{a} (to camera): "They pushed. It held. Good."',
    '{a} answers every question about last night without a wobble.\n{a} (to camera): {cam:story-fine}',
    '{a}’s account survives a proper grilling.\n{a} (to camera): "Solid. Told you."',
    '{a} gets asked twice, and gives the same answer twice.\n{a} (to camera): {cam:story-hold}',
  ],
  wobbles: [
    '{a}’s alibi survives, but takes a beat too long.\n{a} (to camera): {cam:story-close}',
    '{a} has to paper over a small gap in {aPos} story, out loud.\n{a} (to camera): "Got through. But I had to think. You can’t be seen thinking."',
    '{a}’s story gets through, just.\n{a} (to camera): {cam:story-close}',
    '{a} stumbles, recovers, and moves on.\n{a} (to camera): "That was a wobble. I need to tighten it up."',
  ],
  collapses: [
    '{a}’s account comes apart the moment someone actually pushes.\n{a} (to camera): {cam:story-close}',
    'The alibi doesn’t survive. {a} has to abandon it mid-sentence.\n{a} (to camera): "It fell apart. In front of people. I have to fix this tonight."',
    '{a}’s story collapses under one question.\n{a} (to camera): "One question. That’s all it took."',
    '{a} can’t keep {aPos} story together.\n{a} (to camera): {cam:story-close}',
  ],
  'checked-against-somebody': [
    'Nobody asks {a} anything. Someone asks three other people, and the answers don’t match {a}’s.\n{a} (to camera): {cam:story-close}',
    '{a}’s story gets checked behind {aPos} back.\n{a} (to camera): "They didn’t ask me. They asked around me. That’s worse."',
    '{a} finds out people have been comparing notes on {aPos} evening.\n{a} (to camera): {cam:story-close}',
    '{a}’s alibi gets tested while {aSub}’s not in the room.\n{a} (to camera): "I can’t defend a story I’m not there to tell."',
  ],
  'abandoned-it': [
    '{a} stops defending the story, and just says {aSub} doesn’t remember.\n{a} (to camera): "Sometimes the best story is no story."',
    '{a} gives up on the alibi.\n{a}: "I’ve said enough about that night."\n{a} (to camera): {cam:story-hold}',
    '{a} won’t say another word about last night.\n{a} (to camera): "Silence is safer than a bad story."',
    '{a} drops it completely.\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'cover-alibi-crumbles',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // The thread is on the ACTOR, not the scene — see _threadThisEventWouldAdvance.
  threadScope: 'solo',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire', 'rejected'],
    voice: ['strategic', 'temperament', 'mental'],
    alignment: ['traitor'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    const t = findOpenThread(FAMILY, [actor]);
    return t ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-alibi-crumbles');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const partner = ctx.actors.find(n => n !== actor) || null;
    const st = pStats(actor);
    const t = findOpenThread(FAMILY, [actor]);
    // HOW LONG THIS ACCOUNT HAS BEEN IN THE ROOM, off the stored arc. The
    // longer it has been out there, the more other people's versions it has to
    // fit inside — which is what `checked-against-somebody` is about.
    const days = t ? priorMoments(t, ctx.ep).length : 0;
    const scores = {
      holds: (st.strategic / 10) * 0.4 + (st.temperament / 10) * 0.4 + 0.1,
      wobbles: 0.35,
      collapses: (1 - st.temperament / 10) * 0.5 + (1 - st.strategic / 10) * 0.2,
      'checked-against-somebody': Math.min(4, days) * 0.11,
      'abandoned-it': (st.intuition / 10) * 0.2 + Math.max(0, days - 1) * 0.07,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'wobbles';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'checked-against-somebody' ? 'had their account checked while they were elsewhere'
      : branch === 'abandoned-it' ? 'withdrew an account before anybody broke it'
        : 'their account of the night stopped holding';
    const line = pronounSlots(pick(rng, ALIBI_CRUMBLE_LINES[branch]).replace(/\{a\}/g, actor),
      { a: actor });
    let bondDelta = 0;
    if (partner) {
      bondDelta = branch === 'holds' ? 0.5
        : branch === 'wobbles' ? -0.5
          : branch === 'checked-against-somebody' ? -1
            : branch === 'abandoned-it' ? -0.5 : -2;
      if (bondDelta) api.addBond(actor, partner, bondDelta, { source: sceneWhy });
    }
    const advanced = t
      ? api.advanceArc(t.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [actor], { source: sceneWhy, seed: line });
    // TERMINAL: an account withdrawn is a story the teller ended, and
    // `buried` is what it ended as — the room never got to break it.
    if (advanced && branch === 'abandoned-it') {
      api.resolveArc(advanced.id, 'buried', { source: sceneWhy });
    }
    // THE BRANCH IS THE MOMENT. A story that holds is the villain being good
    // at this; one that collapses is the villain sweating, which the crowd
    // enjoys more and warms to slightly. A wobble is neither.
    const colour = branch === 'holds' ? 'masterful'
      : branch === 'collapses' ? 'exposed'
        : branch === 'checked-against-somebody' ? 'exposed' : null;
    return { branch, topic: _accountTopic(), topicKind: 'cover-account', actor, partner, threadId: advanced?.id, bondDelta,
      crowd: colour ? { name: actor, colour } : null };
  },
});
// ── TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ────────────
//
// One branch (`blended-in`) became four, and the four are four different
// results of the same attempt rather than four ways of describing a success.
// Sitting in with the people who have lost somebody is a PERFORMANCE with a
// failure mode, and the failure modes are the interesting half: doing it too
// well, doing it too much, and being quietly not wanted there.
const BLEND_LINES = {
  'blended-in': [
    '{a} sits with {b} and helps {bObj} grieve, for a death {a} helped cause.\n{b}: "I just can’t believe it."\n{a}: "I know. Come here."\n{a} (to camera): {cam:story-fine}',
    '{a} makes sure {b} eats something this morning.\n{a}: "Come on. Just a bit of toast."\n{b}: "Thanks. You’re a good friend."\n{a} (to camera): "I was in the turret last night. And I made {b} toast."',
    '{a} sits with the grieving friends and fits right in.\n{a} (to camera): {cam:story-fine}',
    '{a} comforts {b}, and means some of it.\n{b}: "Thanks for sitting with me."\n{a}: "Any time."\n{a} (to camera): "The kindness is real. The rest isn’t."',
  ],
  'overdid-it': [
    '{a} grieves a bit harder than someone who barely knew them, and {b} notices.\n{a}: "I can’t believe they’re gone."\n{b}: "You hardly spoke to them."\n{b} (to camera): "{a} was more upset than I was. And I was their friend."',
    '{a} is so perfect about it that {b} feels faintly uneasy.\n{b}: "You didn’t know them that well, did you?"\n{a}: "Well enough."\n{a} (to camera): {cam:story-close}',
    '{a} overdoes the grief.\n{a} (to camera): "Too much. I cried too much. People noticed."',
    '{a} makes a show of mourning, and {b} clocks it.\n{a}: "I just can’t stop crying."\n{b}: "…Right."\n{b} (to camera): "Something about {a}’s tears didn’t sit right."',
  ],
  'was-welcomed': [
    '{b} pulls {a} in without being asked.\n{b}: "Sit with us. I’m glad it’s you."\n{a}: "Me too."\n{a} (to camera): "‘I’m glad it’s you.’ I’ll be carrying that one for a while."',
    '{b} is grateful to have {a} there.\n{b}: "You’re one of the good ones, {a}."\n{a}: "So are you."\n{a} (to camera): {cam:story-fine}',
    '{b} welcomes {a} into the circle of grief.\n{b}: "Stay with us today."\n{a}: "Of course."\n{a} (to camera): "They trust me more now. That’s the job. It doesn’t feel like a job."',
    '{b} leans on {a} all morning.\n{b}: "I’m so glad you’re here."\n{a}: "Always."\n{a} (to camera): "{b} doesn’t know. That’s the worst part."',
  ],
  'kept-out': [
    '{a} sits down with the grieving group, and they don’t make room.\n{a} (to camera): {cam:story-close}',
    '{b} is polite and gives {a} nothing.\n{a}: "Mind if I sit?"\n{b}: "Actually, we were just going."\n{a} (to camera): "They closed ranks. I wasn’t welcome. I need to know why."',
    '{a} leaves the group earlier than planned.\n{a} (to camera): "Something’s changed. They don’t want me near them."',
    '{b} keeps {a} at arm’s length.\n{a}: "You alright?"\n{b}: "Fine, thanks."\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'cover-blend-with-victims-friends',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'temperament', 'loyalty', 'strategic'],
    alignment: ['original-traitor', 'recruited-traitor'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Again: the Traitor is whichever of the two IS one (not whichever was
    // drawn first), and `b` is somebody they know is outside the pact — read
    // off `a`'s knowledge, never off `b`'s hidden alignment.
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!a) return 0;
    const b = ctx.actors.find(n => n !== a);
    if (!b || knowsAlignmentOf(a, b, ctx.ep)) return 0;
    return gs?.tr?.rounds?.some(r => r.ep === ctx.ep - 1 && r.murdered) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-blend-with-victims-friends');
    const sceneWhy = 'sat in with the people who had lost somebody';
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    const st = pStats(a);
    const bond = getBond(a, b);
    const scores = {
      'blended-in': (st.social / 10) * 0.45 + (st.temperament / 10) * 0.25,
      'overdid-it': (1 - st.temperament / 10) * 0.4 + (st.strategic / 10) * 0.25,
      'was-welcomed': Math.max(0, bond) / 10 * 0.5 + (st.loyalty / 10) * 0.25,
      'kept-out': (1 - st.social / 10) * 0.4 + Math.max(0, -bond) / 10 * 0.4,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'blended-in';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'blended-in' ? 1
      : branch === 'overdid-it' ? -0.5 : branch === 'was-welcomed' ? 2.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'overdid-it' || branch === 'kept-out' ? 'suspicion' : FAMILY;
    const t = api.openArc(kind, [a, b],
      { source: sceneWhy,
        seed: lineFor(BLEND_LINES[branch], `cover-blend-with-victims-friends|${branch}|${ctx.ep}`, { a, b }) });
    return { branch, topic: b, topicKind: 'cover-blend', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 5). `cover-feign-fear:feigned-fear` was twelfth on
// stage 4's blame table and on the audit's list (the audit's verdict was
// MERGE, into the rehearsal event; it is rewritten in place instead, because
// deleting an event costs the `morning` window scenes it does not have to
// spare and the two premises turn out to fork differently once either of them
// has a fork at all).
//
// PERFORMING FEAR IS A SKILL AND SKILLS ARE PASSED OR FAILED. The old version
// asserted the performance worked, every time, in five sentences. Four
// outcomes now, scored off the performer's own social and temperament against
// noise, exactly the way cover.js scores a lie:
//
//   pitched-it-right   — the room saw somebody as frightened as they were.
//   borrowed-it        — could not find it alone, so copied the nearest
//                        person's reaction beat for beat. Works, and leaves
//                        a habit of watching that person.
//   overdid-it         — too much, too early, and somebody clocked the size
//                        of it. NO BELIEF IS WRITTEN: what the witness has is
//                        that this person was odd at breakfast, which is a
//                        fact about the morning and not about anybody's role.
//   could-not-today    — did not perform at all, and being the one person in
//                        the room with a normal face is its own exposure.
//
// OBSERVER SAFETY. The gate reads the ACTING PLAYER'S OWN alignment and
// nothing else — the same read `cover-suspect-own-ally` makes and the only
// one probes A/B/C in tests/tr-castle.test.js allow. The witness on
// `overdid-it` is drawn from the living room and learns nothing about
// anybody's role; the scene records a bond and an arc, and no belief.
const FEIGN_FEAR_LINES = {
  'pitched-it-right': [
    '{a} looks exactly as frightened as everyone else at breakfast. No more, no less.\n{a} (to camera): {cam:story-fine}',
    '{a} matches the room’s mood perfectly.\n{a} (to camera): "Everyone was scared, so I was scared. Just the right amount."',
    '{a} joins in the worrying at breakfast.\n{a}: "Who’s next? It could be any of us."\n{a} (to camera): "Not me, though. I know that much."',
    '{a} performs fear at exactly the right level.\n{a} (to camera): {cam:story-fine}',
  ],
  'borrowed-it': [
    '{a} watches how {b} looks frightened, and copies it.\n{a} (to camera): "I didn’t know what scared looked like on me. So I borrowed {b}’s."',
    '{a} copies {b}’s nerves, move for move.\n{a} (to camera): {cam:story-hold}',
    '{a} mirrors {b} all morning.\n{a} (to camera): "{b} sighed, I sighed. {b} went quiet, I went quiet."',
    '{a} takes {aPos} cue from {b}.\n{a} (to camera): "Watch someone who’s genuinely scared. Then do what they do."',
  ],
  'overdid-it': [
    '{a} is more devastated than anyone else at the table, and {b} notices.\n{a}: "I can’t eat. I can’t eat a thing."\n{b}: "You barely knew them."\n{b} (to camera): "{a} was falling apart. I don’t buy it."',
    '{a} reaches for fear too early and too hard.\n{a} (to camera): {cam:story-close}',
    '{a} lays it on too thick at breakfast.\n{a}: "It’s just so awful."\n{b}: "It is. You’re taking it very hard."\n{a} (to camera): "I overdid it. I could see {b} looking at me."',
    '{a} performs panic, and it shows.\n{a} (to camera): {cam:story-close}',
  ],
  'could-not-today': [
    '{a} can’t make {aRef} look scared this morning.\n{a} (to camera): "I just couldn’t do it today. I sat there with a normal face."',
    'Everyone at the table is frightened. {a} isn’t, and can’t fake it.\n{a} (to camera): {cam:story-close}',
    '{a} forgets to look worried.\n{a} (to camera): "I was calm. Too calm. Someone’s going to notice."',
    '{a} sits through breakfast looking completely normal.\n{a} (to camera): "Normal looks strange on a morning like this."',
  ],
};

registerEvent({
  id: 'cover-feign-fear',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `cover|morning`.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'temperament', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor && livingFaithfuls(ctx.ep).length ? 1 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-feign-fear');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    // THE ONE OTHER PERSON IN THE SCENE, and the room they are drawn from is
    // the living cast, not the pact — this event says nothing about anybody's
    // role and the witness must not be selected by one.
    const room = (ctx.living || []).filter(n => n !== actor);
    const other = room.length ? pick(rng, room) : null;
    const archetype = players.find(p => p.name === actor)?.archetype || 'floater';
    // A NICE ARCHETYPE WHO TOOK THE RECRUITMENT IS WORSE AT THIS, which is the
    // same competence gap grief-morning-reaction's `opportunistic` branch
    // reads, and for the same reason: the role gate grants the branch, the
    // archetype decides how well it goes.
    const niceButTraitor = NICE_ARCHETYPES.includes(archetype);
    const scores = {
      'pitched-it-right': (st.social / 10) * 0.45 + (st.temperament / 10) * 0.35 + (niceButTraitor ? -0.15 : 0.1),
      'borrowed-it': other ? (st.intuition / 10) * 0.4 + (1 - st.boldness / 10) * 0.3 : 0,
      'overdid-it': other ? (st.boldness / 10) * 0.35 + (niceButTraitor ? 0.3 : 0.05) : 0,
      'could-not-today': (1 - st.social / 10) * 0.4 + (1 - st.temperament / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'borrowed-it' ? 'copied somebody else\'s reaction to the news'
      : branch === 'overdid-it' ? 'grieved a size too large for the room'
        : branch === 'could-not-today' ? 'could not produce a reaction at all this morning'
          : 'performed being frightened for the room';
    const note = lineFor(FEIGN_FEAR_LINES[branch], `cover-feign-fear|${branch}|${ctx.ep}`,
      { a: actor, b: other || 'somebody' });
    // SOLO ARC. A story about an account is a story about ONE person — the
    // party set is the performer, exactly as it was, so `threadScope: 'solo'`
    // in the cover family keeps working.
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, note, { source: sceneWhy });
    let bondDelta = 0;
    if (branch === 'borrowed-it' && other) {
      bondDelta = 0.5;
      api.addBond(actor, other, bondDelta, { source: sceneWhy });
    } else if (branch === 'overdid-it' && other) {
      bondDelta = -1;
      api.addBond(actor, other, bondDelta, { source: sceneWhy });
    }
    const out = { branch, topic: _accountTopic(), topicKind: 'cover-account', actor, threadId: thread?.id, cited, bondDelta };
    // WHO WAS ACTUALLY IN THE SCENE (found by reading a rendered day, and the
    // first fix was not enough).
    //
    // `overdid-it` is a two-person scene: the other person watched the size of
    // it and came away bothered, so they are a participant and the respondent,
    // and the screen may answer in their voice.
    //
    // `borrowed-it` IS NOT. The whole branch is that the other person is
    // copied WITHOUT KNOWING, so there is no exchange and nobody to answer.
    // Returning the pair gave them a reaction card that read as somebody being
    // handed something -- "Beardo takes it, keeps it, and gives no sign at all
    // of what Beardo means to do with it" -- and dropping only the
    // speaker/respondent did not help, because the screen's fallback heuristic
    // then took the last name in the line and arrived at the same person. The
    // scene is one person's, so it reports one person, and the screen composes
    // it with the solo pools, which is what it is.
    //
    // The bond still lands -- the Traitor really did end the morning closer to
    // the person they leaned on -- it simply no longer claims that person was
    // in a scene. The same shape as any event that moves a bond with a named
    // third party.
    if (branch === 'overdid-it' && other) {
      out.pair = [actor, other];
      out.speaker = actor;
      out.respondent = other;
    }
    if (branch === 'overdid-it') out.crowd = { name: actor, colour: 'exposed', mult: 0.3 };
    return out;
  },
});

// ── REWRITE (Task 7 stage 6), AND THE AUDIT'S ROMANCE MERGE FOLDED IN ──
//
// The audit: "one branch (`synchronized`) — the fork is in the wording", and
// its verdict on `romance-shared-alibi` was MERGE INTO THIS ONE — "a couple
// synchronising an account is the swap event with a relationship on it;
// cross-family, and the swap event should take a romance branch." It does now:
// `two-people-who-share-a-bed` is reachable only when the pair actually has an
// open showmance arc, which is a stored fact and not an assumption about them.
//
// THE RECORD THE FORK READS is still what {a} KNOWS and never what {b} IS —
// the weight's `knowsAlignmentOf` is unchanged and the long note below still
// governs — plus the arc's own beat count and both mentals.
const SWAP_STORY_LINES = {
  synchronized: [
    '{a} and {b} go over their stories before anyone else is up.\n{a}: "We went up at half ten. Together."\n{b}: "Half ten. Together. Got it."',
    '{a} and {b} agree on the time and stick to it all day.\n{b}: "Same answer, whoever asks."\n{a}: "Same answer."',
    '{a} and {b} smooth out the bits of their stories that didn’t match.\n{a}: "You said eleven. I said half ten."\n{b}: "Half ten, then."',
    '{a} and {b} line up their accounts at dawn.\n{a}: "Kitchen at ten, fire at half past, up at eleven."\n{b}: "Kitchen, fire, eleven. Done."\n{a} (to camera): "Two stories that match. That’s the dream."',
  ],
  'too-identical': [
    '{a} and {b} match their stories so exactly that people notice.\n{a}: "We went up at eleven."\n{b}: "At eleven."\n{a} (to camera): "Nobody remembers a night to the minute. We did. Out loud. Mistake."',
    '{a} and {b} give word-for-word the same answer.\n{a}: "We were in the kitchen, then the fire."\n{b}: "The kitchen, then the fire."\n{a} (to camera): {cam:story-close}',
    '{a} and {b} are a bit too in sync.\n{a}: "Eleven o’clock."\n{b}: "Eleven o’clock, exactly."\n{b} (to camera): "We sounded rehearsed. Because we were."',
    'Someone notices {a} and {b} used the same phrase.\n{a}: "Why did you say ‘like clockwork’?"\n{b}: "Because you did!"\n{a} (to camera): "Same words. Same order. I could have killed {b}."',
  ],
  'would-not-square-it': [
    '{a} tries to smooth their stories out, and {b} won’t move a single detail.\n{b}: "I’m not changing what I said."\n{a}: "You have to."\n{b}: "I don’t."',
    '{b} refuses to line up with {a}.\n{a}: "We need the same story."\n{b}: "I’m telling the truth. Make yours match mine."\n{a} (to camera): {cam:story-close}',
    '{b} won’t budge on the details.\n{b}: "If I change it now, it looks worse."\n{a}: "It looks worse if they don’t match!"',
    '{a} and {b} can’t agree on their story.\n{a}: "You said half ten."\n{b}: "And you said midnight."\n{a} (to camera): "Two Traitors, two stories. That’s how you get caught."',
  ],
  'were-together-anyway': [
    '{a} and {b} don’t need to arrange anything. They really were together.\n{a}: "We don’t even have to lie."\n{b}: "Makes a change."',
    '{a} and {b} have the easiest alibi in the castle.\n{a}: "Together all night."\n{b}: "All night. Ask anyone."\n{a} (to camera): {cam:story-fine}',
    '{a} and {b} were in the same room all night, and say so.\n{a}: "We were in the same room."\n{b}: "All night."\n{b} (to camera): "The truth is the best alibi. Shame we can’t use it more."',
    '{a} and {b} vouch for each other honestly.\n{a}: "Same room, all night."\n{b}: "Every word of that’s true."\n{a} (to camera): "For once, it’s all true."',
  ],
};

registerEvent({
  id: 'cover-swap-story-with-partner',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'backfire', 'rejected', 'ambiguous'],
    voice: ['mental', 'temperament', 'loyalty'],
    alignment: ['traitor'],
    relationship: ['close-ally'],
  },
  // THE ONE PLACE IN THIS FILE WHERE THE SECOND NAME IS NOT READ OFF GROUND
  // TRUTH (whole-plan review, finding 3). Every other event here gates on the
  // ACTOR's own role, which is self-knowledge and costs nothing. This one
  // gates on a PAIR and then spends +1 bond on it, and bonds feed
  // bondResistance() -> suspicion() in the deduction layer — so a truth-keyed
  // pair bonus is a ground-truth channel into the room's reasoning, arriving
  // by the one route Task 4's whole apparatus does not watch. The pact is
  // still the precondition; it is now read through what `a` KNOWS (the turret,
  // via knowsAlignmentOf) rather than through what `b` IS.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // 2 -> 3 on 2026-09-05. Nineteen solo-only events landed in `dawn` and six
    // other windows (js/tr/castle/alone.js) and this event's firing count fell
    // from 43 to 31 per the prose sweep, under the variety floor of 40 -- not
    // because anything about the pact changed but because a window that used to
    // run out of draws now fills them. The gate is unchanged; only its share of
    // the pair draws it can win is.
    // 3 -> 4 on 2026-09-06, the second bump for the same reason: eleven
    // more events landed in windows this one competes in and its firing
    // count fell 43 -> 31 -> (weight 3) -> 38, against a variety floor of
    // 40. Nothing about the pact gate has changed; the pool around it has
    // grown twice. If a third bump is ever needed, widen the gate instead
    // — a weight climbing to keep pace with the pool is a smell.
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-swap-story-with-partner');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const existing = findOpenThread(FAMILY, [a, b]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    // THE MERGED PREMISE, GATED ON A STORED FACT — AND WIDENED, BECAUSE THE
    // FIRST GATE WAS THE SHAPE STAGE 1 WARNED ABOUT. It required an open
    // showmance arc on top of this event's own Traitor-pact precondition, and
    // a Traitor pair who are also a couple measured THREE firings in 4,200
    // seasons: `tests/tr-castle-prose.test.js`'s own guard-on-the-guard
    // reddened on it, which is exactly what that arm exists to catch. What the
    // branch actually needs is that these two were together anyway, so the
    // true account is the only account — an open romance arc of either stage,
    // or a stored bond high enough that being in the same room all evening is
    // simply what happened. All three are looked up, none is assumed.
    const together = !!findOpenThread('romance-showmance', [a, b])
      || !!findOpenThread('romance-spark', [a, b])
      || getBond(a, b) >= 5;
    const scores = {
      synchronized: 0.4 + (sa.mental / 10) * 0.2,
      'too-identical': Math.min(3, times) * 0.12 + (sa.mental / 10) * 0.15,
      'would-not-square-it': (sb.loyalty / 10) * 0.25 + (sb.temperament / 10) * 0.15,
      'were-together-anyway': together ? 0.55 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'synchronized';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'too-identical' ? 'matched an account so exactly that the matching showed'
      : branch === 'would-not-square-it' ? 'would not move a detail for somebody who needed it moved'
        : branch === 'were-together-anyway' ? 'had the true account and the useless one'
          : 'synchronised an account with somebody else';
    const note = lineFor(SWAP_STORY_LINES[branch], `cover-swap-story-with-partner|${branch}|${ctx.ep}`,
      { a, b });
    const bondDelta = branch === 'synchronized' ? 1
      : branch === 'too-identical' ? 0.5
        : branch === 'would-not-square-it' ? -1.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, topic: _accountTopic(), topicKind: 'cover-account', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// The `night` window runs LAST in the round - after the Round Table and after
// the conclave. For a Traitor that is the one hour of the day with nobody to
// perform for, and it is the only scene in this file where the cover story is
// not being told to anybody. SOLO-CAPABLE deliberately: `_sceneActors` draws a
// single actor about 40% of the time, and a window whose whole pool demands a
// pair is a window that returns nothing on those draws.

const ALONE_LINES = {
  steady: [
    '{a} goes over the day once, finds nothing that needs fixing, and sleeps.\n{a} (to camera): {cam:story-fine}',
    '{a} is asleep in ten minutes.\n{a} (to camera): {cam:slept-fine}',
    '{a} lies down calm.\n{a} (to camera): "Nothing slipped today. Nothing to fix."',
    '{a} has a steady night.\n{a} (to camera): {cam:story-fine}',
  ],
  sleepless: [
    '{a} lies awake running the day backwards, looking for the moment it went wrong.\n{a} (to camera): {cam:story-close}',
    'It’s nearly light before {a} stops going over tomorrow.\n{a} (to camera): {cam:cant-sleep}',
    '{a} can’t sleep for going over everything {aSub} said today.\n{a} (to camera): "Did I say too much? Did anyone notice?"',
    '{a} stares at the ceiling for hours.\n{a} (to camera): {cam:story-close}',
  ],
  nearly: [
    '{a} nearly says it out loud, in an empty room, and stops.\n{a} (to camera): "I nearly told someone today. What I am. I nearly just said it."',
    '{a} almost confides in somebody tonight, and doesn’t.\n{a} (to camera): {cam:story-close}',
    '{a} gets close to telling a friend the truth.\n{a} (to camera): "The weight of it. Some nights I just want to put it down."',
    '{a} nearly breaks tonight.\n{a} (to camera): {cam:homesick}',
  ],
  rehearsing: [
    '{a} doesn’t try to sleep. {a} builds tomorrow, sentence by sentence.\n{a} (to camera): {cam:story-hold}',
    'By two in the morning, {a} has an account of the day that will survive being asked twice.\n{a} (to camera): {cam:story-hold}',
    '{a} runs {aPos} story over and over in the dark.\n{a} (to camera): "Same words. Same order. Again."',
    '{a} lies awake rehearsing.\n{a} (to camera): {cam:rehearse}',
  ],
};

registerEvent({
  id: 'cover-alone-with-it',
  family: FAMILY,
  window: 'night',
  // A cover story is personal - see the note on _threadThisEventWouldAdvance
  // in events.js. Solo scope, or a two-person scene silently misses the thread.
  threadScope: 'solo',
  citesResidue: true,
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['temperament', 'strategic', 'loyalty', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    // The night after the room came for you is a different night.
    return isNervy(ctx.state?.[actor]) ? 3 : 2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-alone-with-it');
    const sceneWhy = 'sat alone with what they had done';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    // Competence at carrying it, not permission to have it.
    const steadyScore = (st.temperament / 10) * 0.6 + (st.strategic / 10) * 0.3;
    const sleeplessScore = (1 - st.temperament / 10) * 0.6 + 0.2;
    const nearlyScore = (st.loyalty / 10) * 0.5 + (1 - st.boldness / 10) * 0.3;
    const rehearsingScore = (st.strategic / 10) * 0.5 + (st.mental / 10) * 0.35;
    const total = steadyScore + sleeplessScore + nearlyScore + rehearsingScore;
    const roll = rng() * total;
    let branch;
    if (roll < steadyScore) branch = 'steady';
    else if (roll < steadyScore + sleeplessScore) branch = 'sleepless';
    else if (roll < steadyScore + sleeplessScore + nearlyScore) branch = 'nearly';
    else branch = 'rehearsing';

    const line = pronounSlots(pick(rng, ALONE_LINES[branch]).replace(/\{a\}/g, actor),
      { a: actor });
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, line, { source: sceneWhy });
    return { branch, topic: _accountTopic(), topicKind: 'cover-weight', actor, threadId: thread?.id, cited, state: ctx.state?.[actor] || 'content' };
  },
});
