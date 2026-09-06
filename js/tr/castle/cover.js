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
  return _sentenceCase(line.replace(/\{a\}/g, a).replace(/\{b\}/g, partner || 'somebody'));
}

import { lineFor, whoTheyTold } from './lines.js';

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
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i] && rounds[i].murdered) return `the night ${rounds[i].murdered} was murdered`;
  }
  return 'what they really are';
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
    '{a} had an answer ready for a question nobody had asked yet.',
    'Nobody had asked where {a} was that night. {a} brought it up anyway, explained it away, and moved the conversation along.',
    '{a} worked out overnight what the awkward question was going to be, and had the boring answer waiting for it.',
    '{a} volunteered a detail so small nobody would ever have thought to check it, which was the whole point.',
    'The story {a} told at breakfast was answering something, and nobody at the table could have said what.',
    '{a} put one dull fact into the room early and never had to put another one in after it.',
  ],
  'asked-for-it': [
    '{a} answered a question nobody had asked, and {b} spent the rest of the morning wondering who had been going to ask it.',
    '{a} mentioned, unprompted, where they had been last night, and then had to sit with having mentioned it.',
    'Nobody was thinking about last night until {a} explained about last night.',
    '{b} had not been curious. {b} is now, and could not tell you what made the difference.',
    '{a} cleared something up that had not been cloudy, and {b} noticed the shape of the cleaning.',
    'It is a strange thing to be told where somebody was. {b} thought so at the time and again later.',
  ],
  'too-specific': [
    '{a} put a time on it, which nobody had asked for, and a time is a thing that can be checked.',
    'The account had a clock in it. {b} did not need the clock and remembered it anyway.',
    '{a} gave three details where one would have done, and the third one had a name in it.',
    '{a} said "about half nine" with more confidence than anybody has about half nine.',
    'It was too good. {b} could not have said why it was too good, and could have said that it was.',
    '{a} answered the unasked question completely, which is not how people answer questions they have not been asked.',
  ],
  'held-it-back': [
    '{a} had the whole account ready at breakfast and did not use a word of it.',
    '{a} came down with an answer and found the room was talking about something else, and let it.',
    'The moment to volunteer it came and went twice, and {a} let it go both times, deliberately.',
    '{a} decided that an unasked question is not a question, and ate breakfast.',
    'It took some doing. {a} had spent an hour on that account and left all of it upstairs.',
    '{a} watched the conversation come within a sentence of it and said nothing at all.',
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
    '{a} threw suspicion at {b} in front of the room — their own ally, on purpose, to clear both their names.',
    'In front of everybody, {a} named {b}. {b} understood the manoeuvre and did not enjoy being the material for it.',
    '{a} needed the room to watch somebody, and picked the person they could most afford to be wrong about.',
    '{a} spent {b} to buy a morning of not being looked at, and did it smoothly enough that only {b} knew the price.',
    '{a} asked {b} a question in front of the room that {a} already knew the answer to.',
    'It was a beautiful piece of work and only two people in the hall knew it was a piece of work.',
    '{a} put {b} in front of the room the way you put a hand in front of a candle.',
    'The room got a name to be busy with, and {a} got an evening off, and {b} got the bill.',
  ],
  'played-along': [
    '{a} named {b} in front of the room, and {b} defended themselves badly, on purpose, and beautifully.',
    '{b} saw what {a} was doing inside a sentence and gave the room exactly the performance it needed.',
    'The two of them ran it like a scene they had rehearsed, and had not.',
    '{b} got flustered at precisely the right moment and stopped at precisely the right moment.',
    '{a} did not have to explain anything afterwards. {b} had understood the whole shape of it live.',
    'It is the best either of them has played all week and nobody in that hall will ever know.',
    '{b} even added a detail {a} had not thought of, which made it worse and better.',
    'Two people did a very dangerous thing in public without exchanging a single look.',
  ],
  'would-not-take-it': [
    '{a} named {b} in front of the room, and {b} refused, flatly, to be the material for it.',
    '“No,” said {b}, and then said why, and the why was addressed entirely to {a}.',
    '{b} turned the question straight back and made {a} answer it in front of everybody.',
    '{a} had assumed {b} would understand. {b} understood perfectly and declined anyway.',
    'It went wrong in about four seconds and both of them spent the rest of the evening on it.',
    '{b} would rather have the row in public than take the hit quietly, and had it.',
    'The room watched two people who are supposed to be allies come apart over one question.',
    '{a} learned tonight exactly how much {b} is prepared to spend on {a}, and it is not this.',
  ],
  'the-room-kept-it': [
    'It worked. It worked so well that the room is still on {b} two days later and {a} cannot call it off.',
    '{a} pointed the room at {b} for one evening. The room has decided to keep {b}.',
    'The name went in easily and will not come out, and {a} needs {b} alive on Thursday.',
    '{a} spent {b} for a morning and has bought {b} a week of it.',
    'By the second day {a} was quietly defending {b} against a suspicion {a} had started.',
    'The manoeuvre had no off switch, which nobody thinks about until they need one.',
    '{b} is now the most-watched person in this castle and {a} is the reason.',
    '{a} would take it back. There is no mechanism in this building for taking it back.',
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
    '{a} found three separate ways to work {c}’s name into casual conversation today.',
    'By the evening, four different people had heard {c}’s name from {a} and none of them noticed where it came from.',
    '{a} never accused {c} of anything. {a} just kept putting {c} in sentences.',
    '{a} asked two people, separately, whether they had seen {c} last night. Neither had. Both remembered being asked.',
    '{a} said {c}’s name once at breakfast, once on the stairs and once at the door, and let the room do the rest.',
    '{a} defended {c}, warmly, to somebody who had not attacked them, and left the name hanging in the air.',
  ],
  'too-obvious': [
    '{a} got {c}’s name into the conversation three times, and {b} noticed the three rather than the name.',
    '"You keep saying that," {b} said, and {a} had not realised {b} had been counting.',
    '{a} worked {c} into a conversation {c} had nothing to do with, and {b} watched the seam show.',
    'It was one mention too many. {b} could not have said what was wrong with it and knew the number.',
    '{b} came away from that conversation thinking less about {c} than about how often {a} had said {c}.',
    '{a} pushed it, slightly, and {b} went quiet in the way people do when they have decided something.',
  ],
  'came-back-round': [
    'By nine o’clock somebody was telling {a} about {c}, in almost {a}’s own words, and believing every one of them.',
    '{a} got {c}’s name back from {b} an hour after putting it out, improved, and had to look pleased about it.',
    'It worked. It worked well enough that {a} could no longer take it back if {a} wanted to.',
    '{b} arrived with a theory about {c} that {a} recognised as {a}’s own, and {a} agreed with it warmly.',
    'The name had gone round {who} and come home to {a} wearing somebody else’s clothes.',
    '{a} listened to {b} explain {c} to {a}, and understood that the thing was now out of anybody’s hands.',
  ],
  'thought-better-of-it': [
    '{a} had {c}’s name ready all evening and did not spend it.',
    '{a} looked at the shape of the room, decided tonight was not the night, and talked about the food.',
    'It was set up and it was easy and {a} left it alone, which took more nerve than doing it would have.',
    '{a} got as far as the first mention and then steered the conversation somewhere harmless.',
    'The room was already looking at somebody. {a} decided not to give it a second name to look at.',
    '{a} kept {c} in reserve, which is a decision, and a slightly frightening one to have made calmly.',
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
    '{a} told the same story again, word for word. Nobody clocked the repetition.',
    '{a} gave the account a second time and did not change a syllable of it, which is not how people remember things.',
    'Asked again, {a} produced the identical version — same details, same order, same small joke in the middle.',
    '{a} had said it enough times now that it came out smooth, and smooth was the risk.',
    'The story had stopped being something {a} remembered and become something {a} recited.',
    '{a} used the same three words in the same three places, for the third day running.',
    'Nobody was checking any more, and {a} told it exactly the same way regardless.',
    '{a} could have said it backwards by now, and had privately checked that they could.',
  ],
  'roughed-it-up': [
    '{a} deliberately got a small detail wrong this morning, because nobody remembers a Tuesday perfectly.',
    '{a} has started putting a hesitation in, on purpose, in the same place every time.',
    'The account acquired an error overnight. It is a very carefully chosen error.',
    '“Half nine — no, quarter to,” said {a}, having decided at four in the morning to say exactly that.',
    '{a} added a thing that had gone wrong, because true stories have one.',
    'A smooth account is a written account, and {a} spent the morning making this one look spoken.',
    '{a} corrected themselves once and let the correction stand, which is the whole trick.',
    'It is worse than it was and it is far more convincing than it was.',
  ],
  'heard-themselves': [
    '{a} got to the middle of it and heard, quite clearly, that it was a performance.',
    'It came out smooth and {a} did not like how smooth, and could not do anything about it mid-sentence.',
    '{a} listened to their own voice doing the small joke for the fourth morning and stopped enjoying it.',
    'Somewhere in the third telling {a} realised that nobody says a Tuesday this well.',
    '{a} finished the account and knew exactly which sentence would be quoted back.',
    'The story is airtight. {a} is now frightened of it, which is a new problem.',
    '{a} has told it so often that {a} can no longer tell whether any of it happened.',
    'What {a} heard this morning was somebody reciting, and {a} was the only one in the room to hear it.',
  ],
  'changed-it': [
    '{a} changed a detail this morning and there is now a version of Tuesday in the room that is out of date.',
    'The account moved half an hour to the left, and two people have the old one.',
    '{a} improved it. Improving it is the single most dangerous thing anybody can do to a story.',
    '{a} could not remember whether the earlier version had the kitchen in it, and guessed.',
    'It is a better account than yesterday’s and it is not yesterday’s.',
    '{a} fixed the weak hour and created a new one in the process.',
    'By breakfast there were two Tuesdays and {a} is the only person who knows both.',
    '{a} will find out which version anybody actually heard at the worst possible moment.',
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
    '{a} broke a small sweat on a completely ordinary follow-up question, with last night\'s votes still sitting on the table behind them.',
    'Somebody asked {a} something harmless and {a} answered it like it was the second question in a much worse conversation.',
    '{a} had been written down last night and it was showing in how carefully they were holding their hands.',
    'The question was nothing. {a}\'s face, with the room still watching them from yesterday, was not nothing.',
  ],
  calm: [
    '{a} broke a small sweat on a completely ordinary follow-up question.',
    '{a} took a beat too long over something entirely routine, and knew it while it was happening.',
    'Nothing about the question was difficult, and {a} still had to swallow before answering it.',
    '{a} laughed at the wrong volume and spent the next minute wondering who had heard it.',
  ],
  // ── TASK 7 STAGE 4: THE FORK MOVED OUT OF THE WORDING ─────────────────
  //
  // The audit's verdict was REWRITE — "one branch (`tell`) — the fork is in
  // the wording, not in the game" — and it was exactly right: `pressed` and
  // `calm` chose a POOL and returned the same branch either way, so the (event,
  // branch) table read this as one outcome and the screen answered it in one
  // register. Two more outcomes now, and they are things that happen rather
  // than ways of saying the first one: the moment is caught and covered
  // over-thoroughly, or it is turned into a joke and survives.
  overexplained: [
    '{a} answered the ordinary question and then answered it again, at length, twice more than was necessary.',
    'Nobody had asked for detail. {a} supplied a great deal of it, in order, with times attached.',
    '{a} corrected a small thing nobody had queried, and then corrected the correction.',
    '{a} explained where {a} had been for a good deal longer than anybody wanted to know.',
    'It was one question. {a} treated it as four, and answered all four, carefully.',
  ],
  'laughed-it-off': [
    '{a} made a joke about how guilty {a} must look, and it landed, and the room moved on.',
    '“Look at me, I’m clearly a murderer,” {a} said, and got a laugh, and did not have to answer the question.',
    '{a} turned the whole moment into something funny before anybody had decided it was a moment.',
    'It could have gone badly for {a} and {a} made it not, in about four words, without appearing to try.',
    '{a} named the awkwardness out loud, which is the one move that reliably kills it, and killed it.',
  ],
  'stopped-talking': [
    'Asked about the night, {a} simply stopped talking, and the stopping was louder than any answer.',
    '{a} had been fine all evening until the question, and then said nothing at all for a beat too long.',
    'The room asked {a} something ordinary and got a silence back that nobody knew what to do with.',
    '{a} did not deny it, explain it or laugh. {a} went quiet, and people noticed the shape of the quiet.',
    'There is a pause that means thinking and a pause that means choosing, and {a} used the second one.',
    '{a} answered every question that evening except one, and left that one hanging.',
    'It was not a lie. It was the absence of one, and it did {a} more damage than a lie would have.',
    '{a} looked at the table instead of answering and the table looked back.',
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
    '{a} told a clean, boring, believable story, and the room moved on without a second look.',
    'Whatever {a} said, it landed exactly as ordinary as intended.',
    '{a} was so unremarkable about it that {b} lost interest halfway through and asked about lunch.',
    '{a} got a detail slightly wrong on purpose, corrected it, and that was what sold the whole thing.',
    '{a} told it flat, without a single flourish, and the room let it go by.',
    'It was the least interesting answer available and it was the right one.',
    '{a} answered, stopped, and did not add anything, which is the whole skill.',
    'Nobody had any follow-up, because there was nowhere for a follow-up to go.',
    '{a} got a detail slightly wrong and corrected it, which sold the rest of it.',
    'The room heard an ordinary Tuesday and went back to what it was doing.',
  ],
  awkward: [
    '{a}\'s story had a wobble in it. Nobody happened to be listening closely enough to catch it.',
    'It wasn\'t {a}\'s best work, but it got through.',
    '{a} lost the shape of it for half a sentence and found it again before anybody looked up.',
    'There was a seam in it, and {a} talked straight over the seam.',
    '{a} answered a question that had not quite been asked, and got away with the difference.',
    'The room was not really listening, which did most of the work.',
    '{a} got the hour wrong by twenty minutes and nobody in that room owns a clock.',
    'It was clumsy and it was quick, and quick beat clumsy.',
    '{a} said “obviously” twice, which is what people say when it is not.',
    'Somebody changed the subject at exactly the right moment, entirely by accident.',
  ],
  suspicious: [
    '{a}\'s answer came a half-second too fast, and at least one person in the room noticed.',
    '{a} was helpful about it. {a} was, on reflection, quite a lot more helpful about it than anybody needed.',
    'There was a version of that answer that took ten words, and {a} used forty.',
    '{a} finished, and the pause afterwards was a beat longer than a boring answer earns.',
    'Something about the way {a} told it made {b} quietly file it away.',
    '{a} answered a question about the kitchen with an alibi for the corridor, and {b} noticed the difference.',
    '{b} had not been suspicious of {a} until {a} was quite that helpful about it.',
    '{a} answered a question nobody had finished asking, and {b} filed that away.',
    'It was all fine and it was all a little too available.',
    '{b} came away without a single fact and with a strong feeling, which is worse for {a}.',
    '{a} volunteered a name. Nobody had asked for a name.',
    'Everything {a} said was plausible and {b} spent the afternoon on the word plausible.',
  ],
  slip: [
    '{a} said too much, too fast, and had to walk it back in real time.',
    'The story fell apart in {a}\'s own mouth halfway through telling it.',
    '{a} named a room, then a different room, and then tried to make both of them true.',
    '{a} corrected themselves out loud, twice, on a question about where they had been standing.',
    '{a} put themselves somewhere at a time {b} could prove they had not been, and heard it land.',
    '{a} named a room and somebody in that room said “no you were not”, quite mildly.',
    'One hour, one word, and {a} could not get either of them back.',
    '{a} said “we” about something {a} had done alone, and the room noticed the “we”.',
    'It was going perfectly well until the bit about the stairs.',
    '{a} heard the slip while making it and carried on, because there is nothing else to do.',
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
    '{a} floated a suspicion about a fellow Traitor to {b} — genuine-sounding enough that {b} took it as proof {a} could not be one.',
    '{a} handed {b} a real name off the turret and let {b} think they had found it themselves.',
    'The safest thing {a} said all day was the truth, aimed at somebody {a} could afford to lose.',
    '{a} told {b} they were frightened of one of the Traitors by name, and {b} filed {a} under the frightened.',
    'Nobody suspects the person doing the suspecting. {a} spent the evening making sure {b} understood that about {a}.',
    '{a} gave {b} something true and expensive, and got a great deal more back for it.',
  ],
  'overpaid-for-it': [
    '{a} gave {b} a real name and watched {b} do rather more with it than {a} had intended.',
    'It worked, and it worked so well that {b} was still on the name at bedtime and {a} could not steer it off.',
    '{a} spent a partner to buy an evening and found out by nine that the price had been the wrong way round.',
    '{b} took the name and ran with it, and {a} had to spend the rest of the night keeping up.',
    'The bluff landed. What it bought {a} was a room now looking hard at somebody {a} needed.',
    '{a} said a true thing to look innocent and made a problem that will still be here on Thursday.',
  ],
  'asked-back': [
    '{a} named somebody frightening to {b}, and {b} asked {a} why {a} had picked that name.',
    '"And why them?" {b} said, and it was a fair question, and {a} had not prepared an answer to it.',
    '{b} did not take the name. {b} took an interest in {a} offering it.',
    '{a} performed being frightened of a Traitor and {b} wanted to know what had made {a} frightened, exactly, and when.',
    'It is a good move that only works if nobody asks the next question. {b} asked the next question.',
    '{b} agreed the name was worth watching and kept looking at {a} while saying so.',
  ],
  'did-not-take': [
    '{a} put a real name in front of {b} and {b} did not want it.',
    '{b} said they had been thinking about somebody else entirely, and would not be moved.',
    'It was true and it was frightening and {b} shrugged at it, which {a} had not planned for.',
    '{a} spent a genuine name for nothing at all, which is the worst outcome this move has.',
    '{b} nodded along and did not change a single thing about how {b} was going to vote.',
    '{a} gave away a partner’s name and did not even get to look innocent for it.',
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
    const out = { branch, topic: b, topicKind: 'cover-deflect', pair: [a, b], speaker: a, respondent: b,
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
    '{a} had a whole account ready for where they’d been the night they made that offer. Nobody had even asked.',
    '{a} has an account of that night ready to go, polished, unrequested, and gathering dust.',
    'Somewhere in {a}’s head is a very good explanation for a conversation nobody knows happened.',
    '{a} keeps almost bringing up that night and then not bringing it up.',
    '{a} rehearsed it once more in the mirror, for an audience that has not asked and might never.',
    'It is the best story {a} has and it has no occasion to be told at.',
    '{a} has a room, a time and a reason for an hour that officially did not happen.',
    'Every morning {a} checks the account is still there, the way you check a pocket.',
  ],
  'told-it-unasked': [
    '{a} explained where {a} had been that night to somebody who had not raised it.',
    'It came out at breakfast, unprompted, complete, and {a} heard it happening.',
    '{a} answered a question about the weather with an alibi for a Tuesday.',
    'Nobody had asked. {a} told them anyway, which is the one thing the account could not survive.',
    'The story was so ready that it went off, and {a} could not get it back in.',
    '{a} volunteered a detail nobody could have known to want and watched it land.',
    '“Why are you telling me this,” asked the person {a} told, quite reasonably.',
    'An unrequested alibi is worse than no alibi and {a} knew that before saying it.',
  ],
  'binned-it': [
    '{a} decided that having an account ready is what gets people caught, and stopped having one.',
    '{a} took the story apart, deliberately, and went into the day with nothing prepared.',
    'The safest version of that night is the one {a} has not thought about, and {a} stopped thinking about it.',
    '{a} has watched somebody be caught by being too ready and is not going to be the second.',
    '{a} let it go before breakfast and felt lighter and considerably less safe.',
    'What {a} kept was the truth, which is that a conversation happened, and nothing else.',
    '{a} has decided to be surprised by the question if it ever comes.',
    'The polished version went in the fire, more or less, and {a} did not miss it.',
  ],
  'they-told-it-first': [
    'The person {a} approached has been telling it all week, and {a} found out this morning.',
    '{a} has a beautiful account of a night that somebody else has already described out loud.',
    'It turns out the other half of that conversation has not been treating it as a secret.',
    '{a}’s story is airtight and is about a night the castle already has a version of.',
    'Somebody said the thing at breakfast and {a} had to arrange a face for it.',
    'The account {a} prepared is now a defence rather than a screen, which is a different job.',
    '{a} learned that the person {sub} brought in has been dining out on the story of it.',
    'What {a} had was a secret. What {a} has is a position, and it is worse.',
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
    '{a}’s account took a real question and shrugged it off without a wobble.',
    'Somebody tried to pull at {a}’s alibi. It didn’t give.',
    'Two people came at {a}’s account from two directions and it was the same account both times.',
    '{a} invited them to check it, which is the last thing anybody does with a story that will not hold.',
    'The question was a good one and the answer had been ready for it since Tuesday.',
    '{a} answered without hurrying, which is the whole of the difference.',
    'It has been asked three ways now and come back the same shape every time.',
    '{a} let a silence sit at the end of it rather than filling the silence, and the silence held too.',
    'Whatever else is true about {a}, that hour is not where anybody is going to find it.',
    'The room moved on, and {a} did not visibly relax, which is also a skill.',
  ],
  wobbles: [
    '{a}’s alibi survived, but it took an extra beat longer than it should have.',
    'There was a small gap in {a}’s story that {a} had to paper over out loud.',
    '{a} had to add a sentence that had not been in it yesterday, and the addition was audible.',
    'The alibi held, but {a} had to hold it, and holding it was visible work.',
    '{a} got there. Two people watched {a} get there, which is not the same as being believed.',
    'One hour of it came out slower than the rest, and slow is what people remember.',
    '{a} answered the question and then answered it again slightly differently, unprompted.',
    'It is still standing and it is not the same shape it was at breakfast.',
    '“Roughly,” said {a}, about a time, having been exact about every other time.',
    'Nobody said anything. Two people wrote it down in the place people write things down.',
  ],
  collapses: [
    '{a}’s account came apart the moment someone actually pushed on it.',
    'The alibi didn’t survive contact — {a} had to abandon it mid-sentence.',
    'Somebody had been in that corridor too, and said so, and there was nothing left of {a}’s version.',
    '{a} tried a third variant, in front of everybody, and it was worse than the second.',
    'It went in one question. One, and {a} had prepared for nine.',
    '{a} said a room that two people had already established was empty.',
    'There is no version of that hour left that {a} can say out loud in this castle.',
    '{a} stopped talking halfway through and could not think of anywhere for the sentence to go.',
    'The whole thing folded, in public, at about half past nine.',
    '{a} watched the room understand it before {a} had finished understanding it.',
  ],
  'checked-against-somebody': [
    'Nobody asked {a} anything. Somebody asked three other people, and the answers did not agree with {a}’s.',
    'The account was tested without {a} in the room, which is much harder to survive.',
    '{a} found out at lunch that the story had been checked at breakfast.',
    'Two other people put that hour together and {a} was not in it the way {a} had said.',
    'It was never a question. It was a comparison, and {a} did not get to answer.',
    'Somebody had gone round the castle with {a}’s Tuesday and collected disagreements.',
    'The alibi is fine. The other four alibis it has to fit inside are not.',
    'Nobody accused {a} of anything. Somebody read out three times and let them sit together.',
    '{a} would have loved a chance to explain and was not offered one.',
    'What broke it was arithmetic done by somebody else while {a} was elsewhere.',
  ],
  'abandoned-it': [
    '{a} stopped defending it. Simply stopped, mid-week, and said “I do not remember” instead.',
    '“I have said too much about a Tuesday,” said {a}, and would not say another word about it.',
    '{a} withdrew the account before anybody broke it, which is the smarter and stranger move.',
    'The story went away. {a} did not replace it with a better one, which is the point.',
    '{a} decided that an unremembered hour is safer than a well-remembered one, and switched.',
    'Everybody in the castle has a version of {a}’s Tuesday except {a}, as of this evening.',
    '{a} let it drop and let the room think what it liked, and the room found that unsettling.',
    'It is a real tactic and it costs a great deal, and {a} paid it rather than be broken.',
    '{a} answered the next four questions with “I could not tell you,” pleasantly.',
    'The account was retired rather than defeated, and only {a} knows the difference.',
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
    const line = pick(rng, ALIBI_CRUMBLE_LINES[branch]).replace(/\{a\}/g, actor);
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
    '{a} sat with {b} and helped them grieve — the same night’s work {a} had a hand in causing.',
    '{a} made sure {b} ate something this morning, and meant it, and had also been in the turret.',
    '{b} cried and {a} was the one holding them, which was true and monstrous at the same time.',
    '{a} said all the right things to {b} about last night, and knew every one of them from the other side.',
    'Nobody comforted {b} better than {a} did, and nobody had less right to.',
  ],
  'overdid-it': [
    '{a} was so much the right person about it that {b} came away faintly unsure why.',
    '{a} grieved slightly harder than anybody who had known them that well, and {b} noticed the size of it.',
    'It was all correct and it was all a little too much, and {b} could not have said which part.',
    '{a} said three kind things about somebody {a} had barely spoken to, and {b} counted them.',
    '{b} was comforted and, an hour later, could not work out why the comforting had felt like an argument.',
  ],
  'was-welcomed': [
    '{b} pulled {a} in without being asked. Whatever {b} thinks, {a} is inside it now.',
    '“I’m glad it’s you,” {b} said to {a}, which is a sentence {a} is going to be carrying for a while.',
    '{b} wanted {a} there specifically, and said so, in front of other people.',
    '{a} did not have to do anything. {b} did the whole thing for {a}, out of pure grief.',
    '{b} thanked {a} for being there, and {a} said the ordinary thing back, and it worked.',
  ],
  'kept-out': [
    '{a} sat down with them and something in the shape of the group did not open up to let {a} in.',
    '{b} was perfectly polite and gave {a} nothing, and {a} left earlier than {a} had planned to.',
    '{a} said the right thing and it landed nowhere. {b} answered somebody else.',
    'There is an inside to a room like that and {a} spent twenty minutes in the doorway of it.',
    '{b} did not want {a} there and was not going to say so, and both of them understood the arrangement.',
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
    '{a} performed the exact right amount of fear at breakfast — no more, no less than anyone else.',
    '{a} was frightened at precisely the average volume of the room, which took some doing.',
    '{a} let their voice go once, briefly, and then got it back, and everybody saw both halves.',
    'The trick is not looking calm. {a} knows that, and spent breakfast not looking calm.',
    '{a} put their cup down a little too hard at the right moment and did not draw attention to having done it.',
    'Whatever {a} was actually feeling, what the room got was an ordinary frightened person having an ordinary bad morning.',
    '{a} asked the same two questions everybody else was asking, in the same order, and got no more attention for it.',
    '{a} did not have to try. That is the part {a} thought about afterwards.',
  ],
  'borrowed-it': [
    '{a} checked what frightened looked like on {b} and did that, about four seconds later, all morning.',
    '{a} could not find it on their own, so {a} took it off {b} — the pause, the hand, the not finishing the sentence.',
    '{b} reacted to the news and {a} reacted to {b}, which is a slower way to be frightened but a reliable one.',
    'Every time {a} did not know what face to have, {a} looked at {b} and borrowed theirs.',
    '{a} spent breakfast about half a beat behind {b}, and nobody in the room measured the half beat.',
    '{a} let {b} set the volume for the whole table and stayed just underneath it.',
    'It is easier to copy than to invent. {a} copied {b}, carefully, for an hour.',
    '{a} would not have got through the morning without {b} in the room, and knew it.',
  ],
  'overdid-it': [
    '{a} was rather more devastated than anybody else at that table, and {b} noticed the size of it.',
    '{a} reached for it too early and too hard, and {b} watched the whole reach.',
    'It was a lot. {b} could not have said what was wrong with it, only that there had been a lot of it.',
    '{a} said the dead person\'s name three times before anybody else had said it once, and {b} counted.',
    '{b} came away from breakfast unable to explain why {a} had bothered them, and unable to stop being bothered.',
    'Nobody grieves wrong, exactly. {b} still thought {a} had grieved oddly.',
    '{a} performed the fear of somebody who had not slept, and had rather obviously slept.',
    '{b} did not say anything about it. {b} did not stop thinking about it either.',
  ],
  'could-not-today': [
    '{a} could not make themselves do it this morning, and sat through breakfast with a completely ordinary face.',
    'Everybody at that table was frightened. {a} was not, and could not find a way to look it.',
    '{a} tried to summon something on the stairs and arrived downstairs with nothing, so {a} ate quietly instead.',
    'There was no performance in {a} today. {a} decided that being quiet was safer than being bad at it.',
    '{a} spent the meal looking at the plate, because the plate did not require a face.',
    'The room was in pieces and {a} was hungry, and the gap between those two things frightened {a} more than the news had.',
    '{a} could not get near it, so {a} did the washing up and stayed out of the room.',
    'Some mornings the trick will not come. {a} sat very still and hoped the stillness read as shock.',
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
    '{a} and {b} ran their stories past each other before anyone else was awake, and smoothed out the parts that didn’t match.',
    'Before the castle was up, {a} and {b} agreed on what time it had been, and stuck to it all day.',
    '{a} and {b} found the one detail they had different and picked the duller of the two.',
    'They rehearsed it once each, {a} then {b}, and then never spoke about it again.',
    '{b} had put themselves in the wrong room. {a} noticed at dawn, and moved them.',
    'Two accounts went into that kitchen and one came out, twice.',
    'It took four minutes and it is the most important four minutes either of them will spend today.',
    '{a} and {b} agreed on a boring hour, which is the only kind that survives.',
  ],
  'too-identical': [
    '{a} and {b} matched it so exactly that two people who were there noticed the matching.',
    'Nobody agrees about a Tuesday to the minute. {a} and {b} did, out loud, in front of somebody.',
    'They smoothed it until there was nothing left to be different about, which is itself a difference.',
    '{a} used {b}’s phrase and {b} used {a}’s, and both of them heard it happen too late.',
    'Two accounts identical to the word is one account read twice, and the room can hear that.',
    '{a} and {b} rehearsed the disagreement as well and delivered it in the same order.',
    'It is airtight and it is the wrong shape, and neither of them can now make it the right one.',
    'Somebody said “you two have talked about this,” which is true and unanswerable.',
  ],
  'would-not-square-it': [
    '{a} came to smooth it and {b} would not move a single detail, and gave no reason.',
    '“I am not changing what I saw,” said {b}, at dawn, to somebody who very much needed {b} to.',
    '{b} refused to have the conversation at all and went back to bed.',
    '{a} needed one hour moved and {b} would not move it, and now there are two Tuesdays.',
    'It is not a disagreement about a fact. It is {b} declining to be managed, and {a} understood that.',
    '{b} has decided to be somebody who tells the truth about small things, starting this week.',
    '{a} left the kitchen with a problem {a} had gone in to solve.',
    'Whatever the two of them are, they are not this, and {b} said so before six in the morning.',
  ],
  'were-together-anyway': [
    '{a} and {b} did not have to arrange anything. They had been in the same room and said so.',
    'It is the easiest alibi in the castle and the least useful one, and both of them know it.',
    '{a} and {b} synchronised nothing, because there was nothing to synchronise, and it will not help.',
    'The account is true, complete and worth precisely nothing to anybody listening.',
    'Two people who are always together agreeing about a night is not evidence, and {b} said so first.',
    'They spent the four minutes on whether to say it at all rather than on what to say.',
    '{a} wanted to invent somebody else in the room. {b} pointed out that there had not been anybody.',
    'What {a} and {b} have is the truth, which in this building is a considerable handicap.',
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
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 3 : 0;
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
    '{a} was asleep inside ten minutes. Whatever the day had cost, it was not costing this.',
    '{a} went over the day once, found nothing that needed fixing, and slept.',
    'Nobody watching would have guessed anything from how easily {a} went down that night.',
    '{a} slept the sleep of somebody with nothing on their mind, which is a skill and not an innocence.',
    'The day did not follow {a} up the stairs. It rarely does.',
    '{a} put the whole thing down at the door of the room and picked it back up in the morning.',
  ],
  sleepless: [
    '{a} lay awake running the whole day backwards, looking for the moment it had gone wrong.',
    'It was nearly light before {a} stopped rehearsing tomorrow\'s version of today.',
    '{a} counted every conversation twice and could not make the last one come out clean.',
    'Every time {a} nearly went under, the same sentence came back and sat them up again.',
    '{a} got up twice to check something nobody was going to check.',
    '{a} argued with somebody who was asleep two rooms away, at length, and lost.',
  ],
  nearly: [
    '{a} got as far as opening their mouth to say it out loud, in an empty room, and stopped.',
    'There was a moment that night where {a} genuinely nearly told somebody, and it passed.',
    '{a} said the true version once, quietly, to nobody, just to hear what it sounded like.',
    '{a} had a whole confession composed by two in the morning and nowhere to put it.',
    'It nearly came out of {a} at the bottom of the stairs, to the first person they saw, and did not.',
    '{a} got as far as the shape of the first word and turned it into something else.',
  ],
  // ── TASK 7 STAGE 4: THE FOURTH BRANCH ─────────────────────────────────
  //
  // The audit's verdict was REWRITE: three branches, and (before stage 2's
  // migration) no effects at all. The fourth is the one the other three imply
  // and none of them is — the hour is not spent surviving it, it is spent
  // WORKING, and tomorrow is built in the dark by somebody who is good at this.
  rehearsing: [
    '{a} did not try to sleep. {a} spent the hour building tomorrow, sentence by sentence, until it fitted.',
    'By two in the morning {a} had an account of the whole day that would survive being asked about twice.',
    '{a} took the version of today {a} intends to give and ran it until the seams stopped showing.',
    'It is work, and {a} did the work: what {a} saw, when, and who else could say so.',
    '{a} lay there deciding which true things to say tomorrow, which is most of the skill of it.',
    '{a} picked the two details that make an account real and made sure both of them were true ones.',
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

    const line = pick(rng, ALONE_LINES[branch]).replace(/\{a\}/g, actor);
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, line, { source: sceneWhy });
    return { branch, topic: _accountTopic(), topicKind: 'cover-weight', actor, threadId: thread?.id, cited, state: ctx.state?.[actor] || 'content' };
  },
});
