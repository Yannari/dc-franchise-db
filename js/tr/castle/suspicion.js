// ══════════════════════════════════════════════════════════════════════
// tr/castle/suspicion.js — the noticed detail, the private accusation, the
// conversation nobody else could hear
// ══════════════════════════════════════════════════════════════════════
//
// None of this writes a belief. A "suspicion" here is a THREAD and some
// RESIDUE — a fact the castle now holds about how two people talk to each
// other — never a claim about who is actually a Traitor. That distinction is
// the whole point of channel-audit.js: an event is free to make the room
// feel uneasy about someone, and only earns the right to make the room
// RIGHT about someone once its channel clears gateChannel() at 200+
// emissions with a durable edge. Nothing here has been measured, so nothing
// here calls learn().
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import {
  findOpenThread, heatAt, actPhrase, lastClosedThread, outcomeSense,
} from '../threads.js';
import { suspicion } from '../deduction.js';
import { lineFor } from './lines.js';

const FAMILY = 'suspicion';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// ── TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ────────────
//
// The verdict was "one branch (`noticed`) — the fork is in the wording, not in
// the game", and it was the second-highest-firing event in `after-table`, so
// the whole window inherited its one outcome. What was missing is that
// noticing a seam is the START of a decision, not the end of one: you keep it,
// you put it to them, you decide it was nothing, or you take it to somebody
// else. Those are four different scenes with four different costs, and only
// the first one was written.
//
// `told-somebody` NAMES THE THIRD PARTY rather than saying the room now knows,
// which is the consensus rule — a doubt that has travelled has a named
// recipient or it has not travelled.
const NOTICE_LINES = {
  noticed: [
    '{a} noticed {b}’s story about last night had a detail that didn’t match this morning.',
    'Something small in how {b} answered a question made {a} quietly file it away.',
    '{a} couldn’t say exactly what it was, but {b}’s timeline felt off by a beat.',
    '{b} corrected themselves halfway through a sentence, and {a} heard the correction more than the sentence.',
    '{a} asked {b} the same question twice, an hour apart, and got two answers that were nearly the same.',
    '{b} was a shade too precise about where they had been, and precision is what people build, not what they remember.',
  ],
  'asked-about-it': [
    '{a} did not file it. {a} put it to {b} on the spot, and watched the whole of the answer.',
    '“You said upstairs. Earlier you said the hall.” {a} asked it plainly and waited through the pause.',
    '{a} repeated {b}’s own sentence back to {b}, both versions of it, in order.',
    '“Which one is it?” {a} asked, and {b} picked one, and the picking took a second too long.',
    '{a} raised the mismatch to {b}’s face rather than to anybody else’s, which {b} did not expect.',
  ],
  'let-it-pass': [
    '{a} caught the seam and decided, deliberately, that it was a person misremembering an evening.',
    '{a} nearly said something and then remembered how many things {a} has misremembered this week.',
    '“That’s nothing,” {a} decided, about {b}, and mostly meant it, and moved on.',
    '{a} let it go, and being the kind of person who lets things go is itself a position in this castle.',
    '{a} chose to believe {b}, which is a choice and {a} knew it was one at the time.',
  ],
  'told-somebody': [
    '{a} did not raise it with {b}. {a} raised it with {c}, quietly, before the corridor emptied.',
    '“Ask {b} about last night,” {a} said to {c}, and would not say any more than that.',
    '{a} took the mismatch to {c} rather than to {b}, which is a decision about {b} and about {c}.',
    '{c} now has the same small wrong detail about {b} that {a} has, and {b} does not know either of them has it.',
    '{a} gave it to {c} whole — both versions of {b}’s evening, and nothing about what it means.',
  ],
};

registerEvent({
  id: 'susp-noticed-inconsistency',
  family: FAMILY,
  window: 'after-table',
  // ACT: TESTING (spec 5.4.3, 'middle: testing, doubting, thread-advancing').
  // Catching a contradiction needs a stock of earlier statements to catch it
  // against, and needs the room still large enough to be worth building on.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // A cold or hostile pair is a much likelier source of nitpicking than a
    // warm one — this is not free-floating suspicion, it wants a seam.
    const [a, b] = ctx.actors;
    const base = getBond(a, b) <= 1 ? 2 : 0.5;
    // SPEC 5.5, BRANCHING ON A CLOSED THREAD'S OUTCOME. Somebody whose last
    // story ended with them talking their way out of it is somebody a small
    // inconsistency is worth noticing about, and the castle knows which of
    // those it was because closeThread wrote the outcome down.
    return outcomeSense(lastClosedThread(b, { beforeEp: ctx.ep })?.outcome) === 'walked'
      ? base * 1.5 : base;
  },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'boldness', 'temperament', 'social'],
    knowledge: ['witnessed', 'heard-with-source'],
    relationship: ['neutral', 'rival', 'close-ally'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-noticed-inconsistency');
    const sceneWhy = 'noticed something that did not line up';
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const third = (ctx.living || []).filter(n => n !== a && n !== b);
    const scores = {
      noticed: (st.intuition / 10) * 0.4 + 0.2,
      'asked-about-it': (st.boldness / 10) * 0.5 + (st.temperament / 10) * 0.2,
      'let-it-pass': (1 - st.intuition / 10) * 0.4 + (st.loyalty / 10) * 0.3,
      // Only available when there is somebody to take it to.
      'told-somebody': third.length ? (st.social / 10) * 0.45 + (1 - st.loyalty / 10) * 0.25 : 0,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'noticed';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const c = third.length ? pick(rng, third) : b;
    const bondDelta = branch === 'noticed' ? -1
      : branch === 'asked-about-it' ? -1.5 : branch === 'let-it-pass' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // The doubt travels to a NAMED person, and to nobody else — the reaction
    // radius is the people the scene actually reached.
    if (branch === 'told-somebody') api.addBond(a, c, 1, { source: sceneWhy });
    let note = lineFor(NOTICE_LINES[branch], `susp-noticed-inconsistency|${branch}|${ctx.ep}`,
      { a, b, c });
    const prior = lastClosedThread(b, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    // A WHOLE SENTENCE, APPENDED, never a clause spliced into a sentence some
    // other line pool owns. Task 2's truncation bug came from editing inside a
    // sentence whose shape a later author was free to change.
    //
    // AND IT NAMES NO DAY. "day N" is Task 2's residue vocabulary and the
    // output guard in tr-castle-reachability.test.js holds it to a strict
    // meaning: every day a note names must be a beat of the thread that note
    // belongs to. This sentence is about a DIFFERENT, closed thread, so it
    // names what happened and not when - the guard caught the first draft of
    // these lines doing exactly that, which is the guard working.
    if (sense === 'walked') note += ` ${b} had been asked about something before, and had walked out of it clean.`;
    else if (sense === 'cracked') note += ` The last time anybody leaned on ${b}, something came out.`;
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta,
      priorOutcome: prior?.outcome ?? null };
  },
});

const OVERHEARD_LINES = [
  '{a} and {b} both clocked {c} and {d} deep in a conversation that stopped the second anyone got close.',
  'Nobody heard a word of it, but {a} and {b} agreed: {c} and {d} were talking about SOMETHING.',
  '{c} and {d} broke apart the moment {a} rounded the corner, and {b} had seen it too.',
  '{a} pointed {b} at the pair of them without pointing at all — just a look, and {b} understood it.',
  'It was the standing too close that did it. {a} and {b} both noticed how little air there was between {c} and {d}.',
  '{c} laughed at something {d} said and neither of them looked comfortable doing it. {a} and {b} filed that away together.',
];

registerEvent({
  id: 'susp-overheard-conversation',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-overheard-conversation');
    const sceneWhy = 'overheard a conversation they were not in';
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const i = Math.floor(rng() * others.length);
    let j = Math.floor(rng() * others.length);
    while (j === i && others.length > 1) j = Math.floor(rng() * others.length);
    const c = others[i], d = others[j] ?? others[i];
    api.addBond(a, b, 1, { source: sceneWhy }); // bonded over shared unease, not over the pair they watched
    const note = pick(rng, OVERHEARD_LINES)
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, c).replace(/\{d\}/g, d);
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'overheard', observers: [a, b], observed: [c, d], threadId: t?.id, bondDelta: 1 };
  },
});

// A tally is a shape, and the shape is what varies: what {a} is actually
// counting differs from pair to pair even though the beat is the same one.
// `{since}` is the thread's own act, spliced where each line wants it.
const TALLY_LINES = [
  '{a} kept a running mental tally on {b}{since} and it was not shrinking.',
  '{a} had a list about {b}{since}, and every day put something else on it.',
  'Nothing {b} did on its own was worth anything. {a} had been adding them up{since}, and the total was.',
  '{a} could have recited {b}\'s week back to them, hour by hour{since}, and had not been asked to.',
  'It was not one thing with {b}. {a} had stopped counting the things{since} and started counting the days.',
  '{a} noticed another one{since}, said nothing about it, and moved it onto the pile with the rest.',
];

registerEvent({
  id: 'susp-pattern-tracking',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // CITES (Plan 5 Task 2). A running tally is a list of days; this is the
  // event in the pool that most obviously owed the reader the days.
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    if (!t) return 0;
    // SPEC 5.3, EMOTIONAL STATE. Somebody the room voted for last night keeps a
    // longer list. ctx.state is READ-ONLY here: it is a frozen view of the
    // round record, not somewhere an event may write.
    return isNervy(ctx.state?.[a]) ? 4.5 : 3;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-pattern-tracking');
    const sceneWhy = 'tracked a pattern across several days';
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    api.addBond(a, b, -0.5, { source: sceneWhy });
    // SPEC 5.2, THE THREAD'S OWN ACT. A tally that started in a different part
    // of the season is a different sentence from one started this morning.
    const since = t.act && t.act !== ctx.act ? `, started back in ${actPhrase(t.act)},` : '';
    // THE BRANCH CARRIES THE STATE, not a constant. A tally that has been
    // running since an earlier act is a different beat from one that started
    // this morning, and until this branch said so the audit's (id, branch)
    // table read both as one thing fired 257 times per 400 seasons and could
    // not see a repeat inside it. Same reasoning as `grief-nobody-sleeps`.
    const note = lineFor(TALLY_LINES, `susp-pattern-tracking|${ctx.ep}|${!!since}`,
      { a, b, since });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, note, { source: sceneWhy });
    return { branch: since ? 'tracked-since' : 'tracked', pair: [a, b], threadId: thread?.id, cited, bondDelta: -0.5,
      acrossActs: !!since };
  },
});

// A dormant thread that gets picked back up out of nowhere — "she never let
// it go" — is a real story beat threads.js was explicitly built to support
// (findOpenThread reaches a cold-but-open thread; heatAt lets us tell cold
// from dead). Gated `rare` so the RARE_MULTIPLIER amplification actually has
// something to amplify once the precondition (an old, cooled thread) exists.
const COLD_CASE_LINES = [
  '{a} brought it up again, completely unprompted — {b} thought that one was dead.',
  'Out of nowhere, over nothing, {a} went straight back to it, and {b} had genuinely stopped expecting that.',
  '{b} had assumed it was finished. {a} had assumed no such thing, and said so in front of people.',
  'Everyone else had moved on from it weeks ago. {a} produced it again like it had never been put down.',
  '{a} said "I never actually got an answer about that," and {b}\'s face did most of the reply.',
];

registerEvent({
  id: 'susp-cold-case-revival',
  family: FAMILY,
  window: 'evening',
  rare: true,
  advancesThread: true,
  // CITES (Plan 5 Task 2). "She never let it go" is unreadable without the
  // day she is refusing to let go OF — this event was the strongest argument
  // for the whole mechanism and had no way to say the thing it is about.
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    if (!t) return 0;
    const heat = heatAt(t, ctx.ep);
    // Cooled (someone let it drop) but never actually closed or abandoned.
    // Weight raised from 2 to 4 (whole-plan review, finding 5): the heat band
    // this needs is narrow AND `evening` is the pool's most crowded window, so
    // even with `rare`'s amplifier it was firing once in ninety seasons.
    if (!(heat > 0 && heat < 1)) return 0;
    // SPEC 5.2, THE THREAD'S OWN ACT. "She never let it go" is a bigger beat
    // when the thing she never let go of belongs to an earlier part of the
    // season than the one everybody is now in.
    return t.act && t.act !== ctx.act ? 6 : 4;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-cold-case-revival');
    const sceneWhy = 'brought an old suspicion back up';
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    const since = t.act && t.act !== ctx.act
      ? ` It had been sitting open since ${actPhrase(t.act)}.` : '';
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, `${lineFor(COLD_CASE_LINES, `susp-cold-case-revival|${ctx.ep}`, { a, b })}${since}`,
      { source: sceneWhy });
    api.addBond(a, b, -1, { source: sceneWhy });
    return { branch: 'revived', pair: [a, b], threadId: thread?.id, cited, bondDelta: -1,
      acrossActs: !!since };
  },
});

const WHISPER_LINES = [
  '{a} and {b} spent breakfast quietly comparing notes on {c}, who had no idea.',
  'Out of earshot of {c}, {a} told {b} exactly what they thought was going on there.',
  '{a} waited until {c} was out of the room before finishing the sentence, and {b} understood why.',
  '{a} and {b} kept their voices under the noise of the kitchen and said {c}\'s name in it twice.',
  'Neither {a} nor {b} would have said any of it to {c}\'s face, which was rather the point of saying it here.',
  '{b} asked what {a} made of {c}, and got a much longer answer than the question deserved.',
];

registerEvent({
  id: 'susp-whisper-about-absent',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `suspicion|morning`. One is not enough on its own:
  // the pair cooldown is five episodes, so a cell with a single advancer can
  // continue a given pair's story at most once every five rounds.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-whisper-about-absent');
    const sceneWhy = 'talked about somebody who was not in the room';
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    api.addBond(a, b, 1, { source: sceneWhy });
    let note = pick(rng, WHISPER_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    // SPEC 5.5. Comparing notes on somebody IS remembering how the last story
    // about them ended. No day number here either - see the note in
    // susp-noticed-inconsistency.
    const prior = lastClosedThread(target, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    if (sense === 'walked') note += ` The last time somebody put ${target} on the spot, ${target} had walked away from it, and that was most of what there was to say.`;
    else if (sense === 'cracked') note += ` They kept coming back to the thing that had already come out of ${target} once.`;
    else if (sense === 'coupled') note += ` Half of it was really about who ${target} had been spending their evenings with.`;
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch: 'whispered', pair: [a, b], about: target, threadId: thread?.id, cited, bondDelta: 1,
      crowd: { name: a, colour: 'cowardly', mult: 0.4 },
      priorOutcome: prior?.outcome ?? null };
  },
});

// ── FLAGSHIP: the private accusation — a four-way fork on the accused's
// reaction, not a description of one outcome in four voices ────────────
//
// The check reads the ACCUSED's stats, because the thing being tested is
// how well they handle being confronted, not how good the accusation was:
//   DENIES CONVINCINGLY  — high temperament + social. The thread that
//                          prompted this actually gets CLOSED — a real state
//                          change, not just a softer sentence, because a
//                          convincing denial is a resolution, not a pause.
//   DENIES WEAKLY        — low temperament under pressure. The thread heats
//                          further; the accusation reads as more credible.
//   TURNS IT BACK         — high boldness + intuition: reframes the exchange
//                          as the accuser's problem. Damages the ACCUSER's
//                          bond, and opens a fresh thread with the narrative
//                          weight on them instead — the roles have swapped.
//   CONFESSES UNRELATED   — high loyalty + low temperament: cracks under the
//                          confrontation and admits to something true but
//                          off-target (not the thing they were accused of).
//                          Resolves the thread with an odd, specific outcome
//                          rather than either accusation succeeding or
//                          failing outright.
const ACCUSE_LINES = {
  denies: [
    '{b} looked {a} dead in the eye and calmly took the accusation apart, point by point.',
    '{a} pushed. {b} didn\'t flinch, and by the end {a} wasn\'t sure they still believed it either.',
    '{b} answered every part of it, in order, without raising their voice once — and that was what settled it.',
    '{a} came in with an accusation and left with an apology they had not planned on giving.',
  ],
  denyWeak: [
    '{b} said the words "that\'s not true" but their voice did something else entirely.',
    '{a} watched {b} deny it, and the denial made {a} more sure, not less.',
    '{b} denied it three times, and nobody had asked twice.',
    '{b} answered the question {a} had not asked, which told {a} everything about the one they had.',
  ],
  turned: [
    '{b} didn\'t answer the accusation — they asked {a} why they were so desperate to make it.',
    'By the end of it, somehow {a} was the one explaining themselves.',
    '{b} let the accusation sit for a second and then asked who had put it in {a}\'s head.',
    'It stopped being about {b} inside a minute, and {a} could not work out when.',
  ],
  confess: [
    '{b} broke, but not about what {a} thought — they admitted to something else entirely.',
    'Cornered, {b} confessed to a different secret altogether, and it landed almost as hard.',
    '{b} gave {a} something true to get out of the room, and it was not the thing {a} came for.',
    '{a} asked one question and {b} answered a heavier one, unprompted, and then looked appalled at themselves.',
  ],
};

registerEvent({
  id: 'susp-private-accusation',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: `fire` returns `pair: [accuser, accused]`, and every branch here
  // (denies / denyWeak / turned / confess) is the ACCUSED answering.
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const bond = getBond(a, b);
    const t = findOpenThread(FAMILY, [a, b]);
    // An accusation this direct wants SOME grounds: either friction already
    // on the record (an open thread) or open hostility.
    if (!t && bond >= 0) return 0;
    return t ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-private-accusation');
    const sceneWhy = 'said it to their face, privately';
    const [accuser, accused] = ctx.actors;
    const st = pStats(accused);
    const denyScore = (st.temperament / 10) * 0.6 + (st.social / 10) * 0.4;
    const denyWeakScore = (1 - st.temperament / 10) * 0.6 + 0.15;
    const turnScore = (st.boldness / 10) * 0.5 + (st.intuition / 10) * 0.5;
    const confessScore = (st.loyalty / 10) * 0.5 + (1 - st.temperament / 10) * 0.5;
    const total = denyScore + denyWeakScore + turnScore + confessScore;
    const roll = rng() * total;
    let branch;
    if (roll < denyScore) branch = 'denies';
    else if (roll < denyScore + denyWeakScore) branch = 'denyWeak';
    else if (roll < denyScore + denyWeakScore + turnScore) branch = 'turned';
    else branch = 'confess';

    const line = pick(rng, ACCUSE_LINES[branch]).replace(/\{a\}/g, accuser).replace(/\{b\}/g, accused);
    const existing = findOpenThread(FAMILY, [accuser, accused]);
    let bondDelta = 0;
    let threadId = existing?.id ?? null;

    if (branch === 'denies') {
      bondDelta = 0;
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'denied-convincingly', { source: sceneWhy });
      } else threadId = api.openArc(FAMILY, [accuser, accused], { source: sceneWhy, seed: line })?.id;
    } else if (branch === 'denyWeak') {
      bondDelta = -1;
      api.addBond(accuser, accused, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [accuser, accused], { source: sceneWhy, seed: line });
      threadId = t?.id ?? threadId;
    } else if (branch === 'turned') {
      bondDelta = -2;
      api.addBond(accuser, accused, bondDelta, { source: sceneWhy });
      // Same party-set, but the note is what carries the reversal — the next
      // reader (a future accusation event, in a later task) has to read the
      // note text to know whose move it is, exactly as trust's "turned"
      // branch does.
      const t = api.openArc(FAMILY, [accuser, accused], { source: sceneWhy, seed: line });
      threadId = t?.id ?? threadId;
    } else {
      bondDelta = 1;
      api.addBond(accuser, accused, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'confessed-unrelated', { source: sceneWhy });
      } else threadId = api.openArc(FAMILY, [accuser, accused], { source: sceneWhy, seed: line })?.id;
    }
    return { branch, pair: [accuser, accused], threadId, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

const TIMELINE_LINES = [
  '{a} and {b} laid out {c}\'s account side by side, and it didn\'t line up cleanly.',
  'Neither {a} nor {b} could quite make {c}\'s morning add up the way {c} told it.',
  '{a} remembered {c} in the kitchen, {b} remembered {c} nowhere near it, and both of them were sure.',
  'Between them, {a} and {b} could account for every hour of {c}\'s day except the one that mattered.',
  '{b} walked {a} through where {c} said they had been, and it took two attempts to get to the end of it.',
  '{a} counted it out on their fingers for {b}. The hours were there; {c} was not in all of them.',
];

registerEvent({
  id: 'susp-timeline-crosscheck',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) <= 2 ? 1.5 : 0.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-timeline-crosscheck');
    const sceneWhy = 'crosschecked where people said they were';
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    api.addBond(a, b, 0.5, { source: sceneWhy });
    const note = pick(rng, TIMELINE_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'crosschecked', pair: [a, b], about: target, threadId: t?.id, bondDelta: 0.5 };
  },
});

const BODY_READ_LINES = [
  '{a} watched {b}\'s hands more than {b}\'s words, and didn\'t love what they saw.',
  '{b} talked. {a} watched where {b} was looking while they did it, which was anywhere else.',
  '{a} had stopped listening to {b} some time ago and started watching them instead.',
  'Nothing {b} said was wrong. It was the shoulders, and {a} could not have explained it to anybody.',
  '{a} clocked how carefully {b} was sitting still, and people do not sit that still by accident.',
  '{b} smiled at the right moment and held it about a second past the right length, and {a} counted the second.',
];

registerEvent({
  id: 'susp-body-language-read',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `suspicion|morning` used to hold three
  // events and not one that could continue a story, so a suspicion opened in
  // this window could only ever be continued somewhere else. Watching somebody
  // for a tell is also the most natural thing in the pool to have done BEFORE:
  // the second time is the beat that means something, and it means it by
  // naming the first.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 6 ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-body-language-read');
    const sceneWhy = 'read something in how somebody was sitting';
    const [a, b] = ctx.actors;
    api.addBond(a, b, -0.5, { source: sceneWhy });
    // SPEC 5.5. What `a` is watching FOR depends on how the last story about
    // `b` ended: a person who came apart once is watched for the next crack.
    const prior = lastClosedThread(b, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    const because = sense === 'cracked'
      ? ` ${a} had seen ${b} come apart once already and was waiting for it to happen twice.`
      : sense === 'walked'
        ? ` Whatever ${b} did the last time somebody asked had worked, and ${a} wanted to know how.`
        : '';
    const note = lineFor(BODY_READ_LINES, `susp-body-language-read|${ctx.ep}|${sense}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, `${note}${because}`, { source: sceneWhy });
    // THE BRANCH STAYS CONSTANT HERE, DELIBERATELY. Splitting it on `sense`
    // measured 162 / 3 / 17 per 400 seasons against a branch floor of 3 —
    // two new cells at or beside the floor, on counts the resampling finding
    // says are redrawn rather than nudged by any later content change. The
    // sense varies the SENTENCE instead (it is in the line key above), which
    // is what a reader actually notices; buying a repeat-detecting label at
    // the price of a knife-edge band is a bad trade.
    return { branch: 'body-read',
      pair: [a, b], threadId: thread?.id, cited, bondDelta: -0.5,
      priorOutcome: prior?.outcome ?? null };
  },
});

const SHAPE_GUESS_LINES = [
  '{a} and {b} sketched out, in whispers, who they thought was actually working together.',
  '{a} named three people to {b} and drew a line between two of them, and {b} moved the line.',
  'They agreed on the shape of it, {a} and {b} — a middle, an outside, and one person they could not place.',
  '{a} asked {b} who they would put in a room together if they wanted to hear something true.',
  'Between them, {a} and {b} built a map of the castle out of who sat where at breakfast.',
  '{b} said a name. {a} said a second one and did not have to explain the connection.',
];

registerEvent({
  id: 'susp-alliance-shape-guess',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return 1.5;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-alliance-shape-guess');
    const sceneWhy = 'guessed at the shape of the room';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 0.5, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(SHAPE_GUESS_LINES, `susp-alliance-shape-guess|${ctx.ep}|${!!existing}`, { a, b });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // THE BRANCH CARRIES THE STATE: two people drawing the map for the first
    // time and two people redrawing one they already have are not one scene.
    return { branch: existing ? 'shape-redrawn' : 'shape-guessed', pair: [a, b], threadId: t?.id, bondDelta: 0.5 };
  },
});

// The irony machine: ordinary defensiveness reads exactly like a Traitor's,
// and the room cannot tell the difference from the outside — this is the
// "frequently wrong" texture the whole format runs on.
//
// BELIEF, NOT TRUTH (whole-plan review, finding 3). This used to gate on
// `alignmentAt(b) === 'faithful'` and then spend a bond on it, which put a
// GROUND-TRUTH channel into the room's reasoning: bonds feed bondResistance()
// -> suspicion() in the deduction layer, so an event that penalises exactly
// the innocent is an oracle pointed at the room, outside every gate Task 4
// built (gateChannel guards `learn()`, and this never touched `learn()`).
// Measured volume at the time: 6,536 Faithful-penalising firings per 5,000
// seasons. The condition is now `a` already having a READ on `b` — which is
// belief, is what `a` could actually act on, and is exactly what the room is
// allowed to feed back into itself. Whether the read is right is not this
// event's business; that is the joke.
const OVERCORRECT_LINES = [
  '{b} explained themselves to {a} for far longer than the question actually required, and it did not help.',
  '{a} asked something almost polite and got back a defence nobody had requested.',
  '{b} gave {a} an alibi for a morning {a} had not mentioned, which was the first {a} had heard of any of it.',
  'Every extra sentence {b} added made the first one look worse, and {b} kept adding them.',
  '{b} answered, and then answered again, and then answered a third time in case {a} had missed it. {a} had not.',
];

registerEvent({
  id: 'susp-defensive-overcorrect',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (suspicion(a, b, ctx.ep) <= 0) return 0;
    return pStats(b).temperament <= 4 ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-defensive-overcorrect');
    const sceneWhy = 'defended themselves harder than the question needed';
    const [a, b] = ctx.actors;
    api.addBond(a, b, -1, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(OVERCORRECT_LINES, `susp-defensive-overcorrect|${ctx.ep}`, { a, b }) });
    return { branch: 'overcorrected', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

const GROUP_PRESSURE_LINES = {
  holds: [
    '{b} took the whole room leaning on them and didn\'t budge an inch.',
    'Six people staring at {b} at once, and {b} just waited them out.',
    'The room asked {b} the same thing four different ways and got the same answer four times.',
    '{b} let the questions pile up and then answered the first one, calmly, as if the rest had not happened.',
  ],
  cracks: [
    '{b} folded under the group pressure fast, and it showed.',
    'It took less than a minute for {b} to start contradicting themselves.',
    '{b} started explaining before anyone had actually accused them of anything.',
    'Somewhere in the third answer {b} stopped talking to the room and started talking to themselves.',
  ],
  redirects: [
    '{b} took the group\'s pressure and pointed it at somebody else entirely.',
    'By the end, the room had forgotten it was ever asking {b} anything.',
    '{b} answered a question about themselves with a question about somebody else, and the room chased it.',
    '{b} handed the room a better target than themselves, and the room took it without noticing the trade.',
  ],
};

registerEvent({
  id: 'susp-group-pressure-crack',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 5) return 0;
    const [, b] = ctx.actors;
    const t = findOpenThread(FAMILY, ctx.actors);
    return t ? 2 : 0.75;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-group-pressure-crack');
    const sceneWhy = 'was leaned on by the room';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const holdsScore = (st.temperament / 10) * 0.5 + (st.boldness / 10) * 0.3 + 0.1;
    const cracksScore = (1 - st.temperament / 10) * 0.6 + 0.1;
    const redirectsScore = (st.strategic / 10) * 0.4 + (st.social / 10) * 0.3;
    const total = holdsScore + cracksScore + redirectsScore;
    const roll = rng() * total;
    let branch;
    if (roll < holdsScore) branch = 'holds';
    else if (roll < holdsScore + cracksScore) branch = 'cracks';
    else branch = 'redirects';

    const line = pick(rng, GROUP_PRESSURE_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    let bondDelta = branch === 'holds' ? 0.5 : branch === 'cracks' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, ctx.actors);
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, ctx.actors, { source: sceneWhy, seed: line });
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});

// THE EVENT THIS TASK IS NAMED AFTER. It printed one sentence, and season
// seed=3 printed it in episodes 1, 4, 8 and 10 — four identical lines in one
// castle. Task 5 widened its cooldown to three episodes, which took the worst
// season from four firings to three and was palliative. This is the fix.
const MISREAD_LINES = [
  '{a} clocked a completely harmless habit of {b}\'s and decided it meant something.',
  '{b} does that thing with their sleeve when they are bored. {a} has decided it is not boredom.',
  '{a} watched {b} do something {b} has done every day of their life and read a confession into it.',
  'It was the way {b} said good morning. {a} could not have told you what was wrong with it, only that something was.',
  '{b} laughed a beat late at something and {a} built an entire theory on the beat.',
  '{a} decided {b} blinks too much when {b} is lying, having never once seen {b} lie.',
  '{b} sat with their back to the door, the way {b} has sat since the first night, and {a} noticed it for the first time and hated it.',
];

registerEvent({
  id: 'susp-misread-tell',
  family: FAMILY,
  window: 'morning',
  // ACT: OPENING. Deciding a harmless habit means something is what suspicion
  // looks like when there is no evidence yet. Late in a season the room has
  // ballots, timelines and bodies to argue from, and does not need a habit.
  acts: { early: 1.6, late: 0.5 },
  // COOLDOWN OVERRIDE, AND THIS ONE WAS FOUND BY READING A DUMPED SEASON.
  // `fire()` writes ONE line, with no pool behind it, so every firing is the
  // same sentence with different names in it. Season seed=3 printed it in
  // episodes 1, 4, 8 and 10 - four identical sentences in one castle. The
  // engine default of two episodes is wrong for a single-line event: it is
  // calibrated for events that at least vary their own text. Widened to three:
  // measured 355 firings per 400 seasons before the widening and 343 after,
  // and the worst case in a single season drops from four firings to three.
  // (Against the pool BEFORE this task it reads 302 -> 343, because the act
  // profile above concentrates it into the early act where it belongs; the
  // two levers pull in opposite directions on purpose - it happens in the
  // first days, and it does not happen on a loop.)
  //
  // PLAN 5 TASK 8 SHIPPED THE REAL FIX, and the cooldown stays anyway. The
  // event now has a seven-line pool (MISREAD_LINES above), so the sentence is
  // no longer the argument for holding it off; the SCENE still is. Somebody
  // inventing a tell out of a mannerism twice in three days is one person
  // behaving oddly, not two beats of a story, and that was true before the
  // pool was thin and is true now that it is not.
  cooldown: { event: 3 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // BELIEF, NOT TRUTH — the same finding as susp-defensive-overcorrect, and
    // the mirror of it. This one wants the ABSENCE of a read: suspicion built
    // out of a mannerism, by somebody who has been told nothing at all. The
    // pair is picked by what `a` knows (nothing), never by what `b` is.
    if (suspicion(a, b, ctx.ep) > 0) return 0;
    return 1.5;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'susp-misread-tell');
    const sceneWhy = 'read a tell that may not have been one';
    const [a, b] = ctx.actors;
    const state = ctx.state?.[a] || 'content';
    // NERVY, not the raw state: `desperate` on its own reads 6 firings per 400
    // seasons, which is inside the noise the branch floor sits in. Paranoid
    // and desperate are the same scene from the reader's side — somebody the
    // room came for last night, inventing evidence — and that is the split
    // worth labelling. The raw state still varies the sentence.
    const nervy = isNervy(state);
    api.addBond(a, b, -0.5, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(MISREAD_LINES, `susp-misread-tell|${ctx.ep}|${state}`, { a, b }) });
    // THE BRANCH CARRIES THE STATE. Somebody the room came for last night
    // inventing a tell is a different scene from somebody comfortable doing
    // it, and the (id, branch) table could not tell them apart before.
    return { branch: nervy ? 'misread-nervy' : 'misread-calm', pair: [a, b], threadId: t?.id, bondDelta: -0.5, state };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// Night is the one window where the castle is quiet enough that a floorboard
// is information. This is NOT a belief write and does not pretend to be one:
// hearing somebody move at three in the morning tells you nothing about what
// they are, which is the joke the whole format runs on. It moves a bond and
// writes a suspicion beat, and the room does the rest of the work wrong.

const DOOR_LINES = {
  heard: [
    '{a} was awake when {b} went past the door, and counted how long it was before {b} came back.',
    'Somebody moved in the corridor after lights-out. {a} knew whose footsteps they were, and said nothing.',
    '{a} lay still and listened to somebody who was not in their own room, and was fairly sure it was {b}.',
    'Two doors down, a floorboard did what floorboards do, and {a} lay awake deciding it was {b}.',
    '{a} heard the corridor door on its slow hinge, twice, and both times it was going the wrong way for {b} to be innocent.',
    'Somebody was awake at the wrong end of the night, and {a} was awake enough to know which end {b} slept at.',
    '{a} put the pillow over their head and could still hear whoever it was, and still thought it was {b}.',
  ],
  imagined: [
    '{a} spent half the night sure somebody had walked past, and half of it sure they had made it up.',
    'There was a sound in the corridor and {a} built four hours of theory on it before dawn.',
    '{a} heard something, decided it was {b}, and had no reason at all for deciding that.',
    'The castle settles at night the way old buildings do, and {a} gave every crack of it {b}\'s name.',
    '{a} was certain, at two in the morning, and much less certain about it at breakfast.',
    'The corridor was empty all night. {a} filled it with {b} anyway.',
    '{a} did not so much hear something as decide, in the dark, that they had.',
  ],
  caught: [
    '{b} came back past the door and found {a} sitting up, wide awake, waiting to see who it would be.',
    '{a} did not bother hiding that they had been listening, and {b} did not bother explaining.',
    'They looked straight at each other in the corridor at three in the morning and neither said a word about it.',
    '{a} opened the door at exactly the wrong moment for {b}, and both of them knew it instantly.',
    '{b} said they had gone for water. {a} had been counting, and it had been a very long glass of water.',
    '{a} was sitting on the stairs when {b} came back up them, and neither pretended to be surprised.',
    '{b} froze at the top of the corridor because {a}\'s door was open, and {a} was behind it.',
  ],
  // ── TASK 7 STAGE 4: THE FOURTH BRANCH, AND IT IS A SOLO ONE ───────────
  //
  // The audit's verdict was REWRITE — three branches, short of four, and no
  // thread write on the original — and the branch count was only half of it.
  // `night` was the thinnest window in the game (1.31 scenes an episode
  // against a 2-4 budget) and this, its single most-fired event, refused a
  // one-person draw. `runWindow` BREAKS rather than skipping when a draw finds
  // nothing eligible, so every solo draw that landed here ended the night.
  // The premise survives being alone perfectly: the whole scene is one person
  // in the dark deciding what a noise was.
  'checked-the-door': [
    '{a} got up at some point in the night to see whether the corridor had anybody in it. It did not.',
    'Something moved, or did not. {a} lay there for a long time deciding which, and settled on neither.',
    '{a} opened the door about four inches, saw an empty corridor, and did not feel any better about it.',
    'There was a noise at the wrong end of the night and {a} spent an hour giving it a name and taking it back.',
    '{a} counted the doors between here and the stairs, twice, for no reason {a} could have defended in daylight.',
    'Old buildings make noise. {a} knows that. {a} still sat up, and still listened, and still did not sleep after.',
    '{a} put a shoe against the door, felt ridiculous about it, and left the shoe where it was.',
    'By the time it got light {a} had built and demolished three separate explanations for one floorboard.',
  ],
};

registerEvent({
  id: 'susp-heard-in-the-corridor',
  family: FAMILY,
  window: 'night',
  // COOLDOWN OVERRIDE (spec 5.4.2). The pool's single most-fired event: 935
  // firings per 400 seasons, up to FIVE in one season. The default 3-episode
  // player window is wrong here in a way it is not wrong elsewhere, because
  // this beat is about the same person lying in the same corridor hearing
  // the same kind of nothing - the second telling adds no information and
  // reads as the castle looping. The pair and event scopes are left alone:
  // a DIFFERENT person hearing something the next night is a real scene.
  cooldown: { player: 5 },
  citesResidue: true,
  // ADVANCES, AND SAYS SO. The original wrote no thread at all, which was the
  // other half of the audit's REWRITE verdict: the pool's single most-fired
  // event left nothing behind for anything to continue.
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'temperament', 'boldness'],
    relationship: ['neutral', 'rival', 'close-ally'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    // WIDENED FROM `length !== 2` TO "one or two" — see `checked-the-door`.
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const [a] = ctx.actors;
    // SPEC 5.3. Somebody the room came for today does not sleep, and does not
    // stop listening. ctx.state is a frozen, read-only view of the last table.
    return isNervy(ctx.state?.[a]) ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-heard-in-the-corridor');
    const sceneWhy = 'heard something in the corridor after lights out';
    const [a, b] = ctx.actors;
    if (!b) {
      const soloNote = lineFor(DOOR_LINES['checked-the-door'],
        `susp-heard-in-the-corridor|checked-the-door|${ctx.ep}`, { a });
      const solo = arcContinue(api, FAMILY, [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'checked-the-door', actor: a, threadId: solo.thread?.id,
        cited: solo.cited, bondDelta: 0, state: ctx.state?.[a] || 'content' };
    }
    const sa = pStats(a);
    const sb = pStats(b);
    // What the listener ends up with: a sharp one hears a real thing, an
    // anxious one invents one, and a bold mover gets seen coming back.
    const heardScore = (sa.intuition / 10) * 0.6 + 0.15;
    const imaginedScore = (1 - sa.temperament / 10) * 0.6 + 0.2;
    const caughtScore = (sb.boldness / 10) * 0.5 + (1 - sb.intuition / 10) * 0.4;
    const total = heardScore + imaginedScore + caughtScore;
    const roll = rng() * total;
    let branch;
    if (roll < heardScore) branch = 'heard';
    else if (roll < heardScore + imaginedScore) branch = 'imagined';
    else branch = 'caught';

    const line = pick(rng, DOOR_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const bondDelta = branch === 'caught' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta,
      state: ctx.state?.[a] || 'content' };
  },
});
