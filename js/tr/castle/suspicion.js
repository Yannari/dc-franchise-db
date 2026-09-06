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
  findOpenThread, heatAt, actPhrase, lastClosedThread, outcomeSense, priorMoments,
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
    '{b} described where they had been with the kind of detail people add afterwards, not the kind they carry.',
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
    '{a} let it go, and filed {b} somewhere between harmless and worth watching.',
    '{a} chose to believe {b}, which is a choice and {a} knew it was one at the time.',
  ],
  'told-somebody': [
    '{a} did not raise it with {b}. {a} raised it with {c}, quietly, before the corridor emptied.',
    '“Ask {b} about last night,” {a} said to {c}, and would not say any more than that.',
    '{a} took the mismatch to {c} instead of {b}, trusting {c} with it and not trusting {b} to explain it.',
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

// ── REWRITE (Task 7 stage 5). Top of the blame table at 26 of 287 loud
// seasons once `runWindow`'s barren-draw fix tripled `evening`'s throughput:
// one branch, one six-line pool, on a broadly-gated event.
//
// SEEING TWO PEOPLE STOP TALKING IS NOT THE SCENE. What the two watchers do
// about it is, and there are four things and they are not interchangeable —
// agree what it was, argue about whether it was anything, go and ask, or take
// it to somebody else. The fact underneath every one of them is the same and
// is the only thing any branch asserts: {c} and {d} were talking and stopped.
// Nobody in this scene claims to know what about.
//
// AND A SOLO BRANCH, for the reason the window needed one: a solo draw in
// `evening` faced 0.51 eligible events against a pair draw's 8.49. One person
// seeing it with nobody to confirm it is a worse position than two, which is
// the whole point of the branch.
const OVERHEARD_LINES = {
  'agreed-what-it-was': [
    '{a} and {b} both clocked {c} and {d} deep in a conversation that stopped the second anyone got close.',
    'Nobody heard a word of it, but {a} and {b} agreed: {c} and {d} were talking about something.',
    '{c} and {d} broke apart the moment {a} rounded the corner, and {b} had seen it too.',
    '{a} pointed {b} at the pair of them without pointing at all — just a look, and {b} understood it.',
    'It was the standing too close that did it. {a} and {b} both noticed how little air there was between {c} and {d}.',
    '{c} laughed at something {d} said and neither of them looked comfortable doing it. {a} and {b} filed that away together.',
  ],
  'argued-about-it': [
    '{a} thought {c} and {d} breaking apart like that meant something. {b} thought {a} needed to sit down.',
    '"They were talking. People talk." {b} would not have it, and {a} could not make {b} see it.',
    '{a} had watched {c} and {d} stop mid-sentence and {b} had watched two friends have a chat, and neither budged.',
    '{b} pointed out that {a} had been walking past a lot of doors lately, and {a} did not enjoy that.',
    'The argument stopped being about {c} and {d} and started being about how {a} was spending the evenings.',
    '{a} wanted {b} to have seen what {a} saw. {b} had been standing right there and had seen nothing.',
  ],
  'went-and-asked': [
    '{a} and {b} did the unusual thing and simply went and asked {c} what that had been about.',
    'Rather than sit on it, {a} walked straight over to {c} and {d} with {b} half a step behind.',
    '"What are we talking about?" {a} said, cheerfully, arriving. {c} answered. {d} answered slightly differently.',
    '{a} and {b} asked {c} outright, and got an answer so ordinary that it was hard to know what to do with.',
    '{b} would not let {a} theorise about it for an hour, so the two of them went and got the answer instead.',
    'They asked. {c} explained. {a} believed it and {b} did not, and that was the end of the evening.',
  ],
  'told-somebody-else': [
    '{a} and {b} did not keep what they had seen. By bedtime a third person had it, with the corner and the timing in it.',
    'What {a} and {b} saw was in somebody else’s hands within the hour, and neither of them had decided to do that.',
    '{a} told it once, to one person, carefully. {b} told it once, to another, less carefully.',
    'It went round the castle in the shape {a} and {b} had put it in, which was not quite the shape it had happened in.',
    '{b} said it should stay between them. It stayed between them and two other people.',
    '{a} and {b} agreed not to make anything of it and then both made something of it separately.',
  ],
  'saw-it-alone': [
    '{a} saw {c} and {d} stop talking and had nobody at all to check it against.',
    'There was no witness. {a} came round the corner alone, saw two people go quiet, and carried on walking.',
    '{a} would have liked somebody else to have seen it, because seeing a thing on your own is worth almost nothing here.',
    '{c} and {d} stopped mid-sentence when {a} appeared, and {a} spent the rest of the evening deciding whether that was true.',
    'By the time {a} got somewhere to think about it, {a} was no longer certain what {a} had actually seen.',
    '{a} saw two people in a corner go quiet, alone, with nobody to tell about it.',
    '{a} did not say anything about it to anybody, because there is no way to say it that does not sound like nothing.',
    '{a} kept it, and kept turning it over, and it did not get any bigger for the turning.',
    'Nobody else was in that corridor. {a} has learned what a fact with one witness is worth.',
    '{a} went back past the same corner twenty minutes later, which is not a thing {a} would have admitted to.',
    'By morning {a} had talked {a}’self out of it entirely, and by lunch back into it.',
    '{a} tried saying it in {a}’s head and heard how it would sound out loud, and stopped.',
    'Two people stopping talking is not evidence of anything, and {a} knew that, and could not let it go.',
    '{a} has now watched that corner three times this week and has nothing to show for any of it.',
    'It might have been nothing. Most things are nothing. {a} could not make this one be nothing.',
    '{a} decided to mention it to somebody and then spent the evening auditioning who.',
    'What {a} actually saw was a pause. What {a} was carrying by bedtime was rather larger than a pause.',
    '{a} would have felt better if somebody else had been there and worse if they had disagreed.',
  ],
};

registerEvent({
  id: 'susp-overheard-conversation',
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'boldness', 'temperament', 'social'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    // WIDENED TO A SOLO DRAW (Task 7 stage 5) — see the header.
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return ctx.actors.length === 1 ? 1.2 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-overheard-conversation');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const i2 = Math.floor(rng() * others.length);
    let j2 = Math.floor(rng() * others.length);
    while (j2 === i2 && others.length > 1) j2 = Math.floor(rng() * others.length);
    const c = others[i2], d = others[j2] ?? others[i2];
    if (!b) {
      const soloWhy = 'saw two people stop talking, with nobody to confirm it';
      const t = api.openArc(FAMILY, [a], { source: soloWhy,
        seed: lineFor(OVERHEARD_LINES['saw-it-alone'], `susp-overheard-conversation|saw-it-alone|${ctx.ep}`,
          { a, c, d }) });
      return { branch: 'saw-it-alone', actor: a, observed: [c, d], threadId: t?.id, bondDelta: 0,
        topic: c, topicKind: 'suspicion-third' };
    }
    const st = pStats(b);
    const scores = {
      'agreed-what-it-was': (st.intuition / 10) * 0.5 + Math.max(0, getBond(a, b)) / 10 * 0.35,
      'argued-about-it': (st.temperament / 10) * 0.35 + Math.max(0, getBond(b, c)) / 10 * 0.4,
      'went-and-asked': (st.boldness / 10) * 0.5 + (st.social / 10) * 0.25,
      'told-somebody-else': (st.social / 10) * 0.4 + (1 - st.loyalty / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s2, k) => s2 + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'argued-about-it' ? 'could not agree that they had seen the same thing'
      : branch === 'went-and-asked' ? 'went and asked the two of them directly'
        : branch === 'told-somebody-else' ? 'passed on what they had seen'
          : 'overheard a conversation they were not in';
    const bondDelta = branch === 'agreed-what-it-was' ? 1
      : branch === 'argued-about-it' ? -1 : branch === 'went-and-asked' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(OVERHEARD_LINES[branch], `susp-overheard-conversation|${branch}|${ctx.ep}`,
      { a, b, c, d });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, observers: [a, b],
      observed: [c, d], topic: c, topicKind: 'suspicion-third', threadId: t?.id, bondDelta };
  },
});

// A tally is a shape, and the shape is what varies: what {a} is actually
// counting differs from pair to pair even though the beat is the same one.
// `{since}` is the thread's own act, spliced where each line wants it.
// ── REWRITE (Task 7 stage 6). The audit's verdict was "2 branches, short of
// four materially different paths", and stage 5's transcript read found the
// worse half of it: this event rendered INVERTED on a real day. Its lines put
// {a} — the person keeping the tally — LAST, so `_order`'s fallback heuristic
// (js/vp-tr/castle-day.js) handed the tally-keeper the cornered party's
// reaction card and then inverted the consequence card behind it. The fix is
// the field Task 6 added for exactly this, and it is populated PER BRANCH,
// because on this event the direction is a property of the branch.
//
// THE RECORD THE FORK READS IS THE LIST ITSELF. `priorMoments(t, ep)` is how
// many days this story has actually accumulated — the tally, stored, the thing
// the sentence claims exists. A one-beat thread is somebody who noticed a
// thing yesterday; a four-beat thread is a person who has been keeping a
// ledger for a week, and those are not the same scene and must not be able to
// print each other's sentences. Nothing here invents a fact: the length of the
// list is read, never asserted.
//
// FIVE THINGS A PERSON DOES WITH A LIST THEY HAVE BEEN KEEPING:
//
//   tracked          — adds today's to it and says nothing. {b} does not know
//                      this scene happened, so the record names ONE
//                      participant and the screen composes it solo. Same
//                      reasoning as stage 5's `cover-feign-fear:borrowed-it`.
//   tracked-since    — the same, but the list crosses an act boundary, which
//                      is a longer and colder version of the same silence.
//   put-it-to-them   — the list stops being private. {a} recites it to {b}.
//                      THIS is the branch with a respondent, and it is the
//                      only one that ever had one.
//   showed-somebody  — {a} takes the ledger to a third party instead, which
//                      is how a private tally becomes the room's.
//   let-the-list-go  — the terminal outcome the event never had. {a} reads
//                      their own list back, finds it is a list of a person
//                      being a person, and buries it.
const TALLY_LINES = {
  tracked: [
    '{a} kept a running mental tally on {b}{since} and it was not shrinking.',
    '{a} had a list about {b}{since} and every day put something else on it.',
    'Nothing {b} did on its own was worth anything. {a} had been adding them up{since} and the total was.',
    '{a} could have recited {b}’s week back to them, hour by hour{since} and had not been asked to.',
    'It was not one thing with {b}. {a} had stopped counting the things{since} and started counting the days.',
    '{a} noticed another one{since} said nothing about it, and moved it onto the pile with the rest.',
    '{a} added this morning to the {b} column{since} and did not tell a living soul it had a column.',
    'There is a version of {b}’s week in {a}’s head{since} that {b} would not recognise and could not disprove.',
    '{a} watched {b} do one more small ordinary thing{since} and filed it with all the other ones.',
    '{a} has never written any of it down. {a} does not need to{since} it is in order and it is complete.',
  ],
  'put-it-to-them': [
    '{a} put the whole list to {b}, in order, dated, and waited to be told which part of it was wrong.',
    '“Do you want it from the first day, or from Tuesday,” {a} said, and {b} learned there had been a first day.',
    '{a} recited four things {b} had done and asked {b} to explain any one of them.',
    'It had been private for days. {a} made it not private, out loud, with {b} standing there.',
    '{a} said the list. It took about ninety seconds, and {b} did not interrupt any of it.',
    '“None of them are anything,” {a} said to {b}. “That is what I keep coming back to.”',
    '{a} laid it out for {b} the way you lay out an argument you have already won in your head.',
    '{b} asked {a} what this was about, and {a} answered with a week of it.',
  ],
  'showed-somebody': [
    '{a} did not take the list to {b}. {a} took it to {c}, and {c} listened to all of it.',
    '{a} had been keeping it alone. {a} stopped keeping it alone, and {c} is keeping it too now.',
    '“Tell me I am imagining this,” {a} said to {c}, about {b}, and {c} did not tell {a} that.',
    '{a} handed {c} the whole shape of it — {b}, the days, the order — and asked for nothing back.',
    'The tally on {b} acquired a second reader this morning, and {c} did not have to be persuaded.',
    '{a} said {b}’s name to {c} and then said six more things, and {c} remembered all seven.',
    '{a} needed one other person to have it in case {a} was wrong, and picked {c} to be that person.',
    'By breakfast the list about {b} existed in two heads instead of one, which is a different kind of object.',
  ],
  'let-the-list-go': [
    '{a} read the list back and found it was a list of somebody being a person, and stopped keeping it.',
    'Four days of it, and not one entry survived {a} saying it out loud to {a}. {a} let {b} alone.',
    '{a} looked for the day it started and could not find one, and that was the end of the tally.',
    'It came apart when {a} tried to put the days in order and the order did not mean anything.',
    '{a} decided that a person you are watching will always give you something to write down, and put the pen away.',
    '{a} has been wrong about somebody before, and noticed the shape of it in time, and let {b} go.',
    'The tally on {b} ended the way most of them end, which is that {a} got tired of being right.',
    '{a} gave it one more morning, got nothing, and closed the book on {b} without telling anybody it had been open.',
  ],
};

registerEvent({
  id: 'susp-pattern-tracking',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // CITES (Plan 5 Task 2). A running tally is a list of days; this is the
  // event in the pool that most obviously owed the reader the days.
  citesResidue: true,
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected', 'backfire'],
    voice: ['intuition', 'strategic', 'temperament'],
    knowledge: ['incomplete', 'witnessed'],
    relationship: ['rival', 'neutral'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-pattern-tracking');
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    // THE LIST, READ RATHER THAN ASSERTED. Every branch below is about how
    // long this has been going on, and this is where that fact lives.
    //
    // NOTE ON `{since}`: it supplies its OWN commas (", started back in ...,")
    // so that it can sit mid-clause in a line that has none. Four of the
    // `tracked` templates carried a comma of their own right after the
    // placeholder and printed ",," on any firing that crossed an act — visible
    // in a dumped day, invisible to every assertion, and shipping since before
    // this task. Those four now leave the punctuation to `since`.
    const entries = priorMoments(t, ctx.ep).length;
    const st = pStats(a);
    const third = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = third.length ? third[Math.floor(rng() * third.length)] : null;
    const scores = {
      tracked: 0.55 + (st.temperament / 10) * 0.35,
      // A list you put to somebody's face has to BE a list first, and it needs
      // the boldness to say it. Both terms are read; neither is invented.
      'put-it-to-them': (st.boldness / 10) * 0.4 + Math.min(3, entries) * 0.13,
      // Taking it to a third party needs a third party and a reason to talk.
      'showed-somebody': c ? (st.social / 10) * 0.35 + Math.min(3, entries) * 0.1 : 0,
      // Dropping it is what a long list with nothing on it eventually earns.
      'let-the-list-go': (st.intuition / 10) * 0.3 + Math.max(0, entries - 2) * 0.12,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'tracked';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    // SPEC 5.2, THE THREAD'S OWN ACT. A tally that started in a different part
    // of the season is a different sentence from one started this morning, and
    // it stays a distinct BRANCH on the silent path for the reason the earlier
    // version of this event gave: without it the (id, branch) table read both
    // as one thing and could not see a repeat inside it.
    const since = t.act && t.act !== ctx.act ? `, started back in ${actPhrase(t.act)},` : '';
    const sceneWhy = branch === 'put-it-to-them' ? 'said a week of somebody back to them'
      : branch === 'showed-somebody' ? 'gave a private tally a second reader'
        : branch === 'let-the-list-go' ? 'read a list back and found nothing in it'
          : 'tracked a pattern across several days';
    const note = lineFor(TALLY_LINES[branch],
      `susp-pattern-tracking|${branch}|${ctx.ep}|${!!since}`,
      { a, b, c: c || b, since: branch === 'tracked' ? since : '' });
    const bondDelta = branch === 'put-it-to-them' ? -1.5
      : branch === 'let-the-list-go' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'showed-somebody' && c) api.addBond(a, c, 0.5, { source: sceneWhy });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, note, { source: sceneWhy });
    // THE TERMINAL OUTCOME THE EVENT DID NOT HAVE. A tally that gets dropped
    // is a story that ended, and `buried` is the outcome for a thing nobody
    // else ever learned had been going on.
    if (branch === 'let-the-list-go' && thread) {
      api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    }
    const out = { branch: branch === 'tracked' && since ? 'tracked-since' : branch,
      threadId: thread?.id, cited, bondDelta, acrossActs: !!since };
    if (branch === 'put-it-to-them') {
      out.pair = [a, b];
      out.speaker = a;
      out.respondent = b;
    } else if (branch === 'showed-somebody') {
      out.pair = [a, c];
      out.speaker = a;
      out.respondent = c;
    } else {
      // ONE PARTICIPANT, BECAUSE ONE PERSON IS IN THIS SCENE. {b} does not
      // know the list exists. Naming {b} a participant is what let the screen
      // hand {b} a reaction card in a conversation {b} was not having.
      out.actor = a;
    }
    return out;
  },
});

// A dormant thread that gets picked back up out of nowhere — "she never let
// it go" — is a real story beat threads.js was explicitly built to support
// (findOpenThread reaches a cold-but-open thread; heatAt lets us tell cold
// from dead). Gated `rare` so the RARE_MULTIPLIER amplification actually has
// something to amplify once the precondition (an old, cooled thread) exists.
//
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`revived`) — the fork
// is in the wording, not in the game." What was missing is that reopening an
// old story is a MOVE, and the interesting question is not whether {a} makes
// it but what it does when it lands. Four answers, and the fork is read off
// the thread itself rather than rolled: `heatAt` says how cold the thing
// actually went, and the number of beats already on it says how many times
// this room has been round it. Both are stored; neither is asserted.
//
//   revived            — it comes back up and stays up.
//   answered-at-last   — {b} finally gives the answer {b} never gave, and it
//                        holds. Terminal: `denied-convincingly`.
//   nobody-cared       — {a} produces it and the room has moved on, which is
//                        the worst outcome for the person producing it.
//   put-it-down        — {a} gets as far as saying it and hears how old it is.
//                        Terminal: `buried`.
const COLD_CASE_LINES = {
  revived: [
    '{a} brought it up again, completely unprompted — {b} thought that one was dead.',
    'Out of nowhere, over nothing, {a} went straight back to it, and {b} had genuinely stopped expecting that.',
    '{b} had assumed it was finished. {a} had assumed no such thing, and said so in front of people.',
    'Everyone else had moved on from it weeks ago. {a} produced it again like it had never been put down.',
    '{a} said “I never actually got an answer about that,” and {b}’s face did most of the reply.',
    '{a} had been carrying it the whole time without mentioning it once, which {b} found much worse than shouting.',
    'It came back up in the middle of something else entirely, which is how {a} had planned it.',
    '{a} used the exact words {b} had used at the time, and {b} recognised every one of them.',
  ],
  'answered-at-last': [
    '{b} gave {a} the answer {b} had never given, and it was dull, and it was complete.',
    'It turned out there had always been an explanation. {b} had simply never thought {a} deserved one.',
    '{a} finally asked it as a question rather than an accusation, and got a question’s answer back.',
    '{b} said the whole of it, start to finish, and {a} could not find anywhere for it to be wrong.',
    'The thing {a} had been carrying for a week took {b} about forty seconds to put down.',
    '{b} answered, and then let {a} check it with somebody else, which is what did it.',
    '“I should have said this at the time,” {b} said, and then said it.',
    '{a} came for a confession and got an explanation, and had the good grace to take it.',
  ],
  'nobody-cared': [
    '{a} put it back on the table and found that the table had been cleared some days ago.',
    'Nobody else remembered it. {a} explaining why it mattered was the part everyone remembered.',
    '{b} did not even defend it. {b} said “that was ages ago,” and the room agreed with {b}.',
    '{a} was the only person in the castle still holding it, and it showed, and it cost.',
    'The story {a} produced belonged to a season two banishments ago and read like it.',
    '{a} got about a sentence and a half in before somebody changed the subject and nobody changed it back.',
    'It landed on the floor. {a} was the only one who looked down.',
    '{b} let {a} finish and then asked about dinner, and that was the end of it.',
  ],
  'put-it-down': [
    '{a} got as far as saying it out loud and heard, in {a}’s own voice, how old it had got.',
    '{a} had it ready all evening and did not use it, and by bedtime had stopped wanting to.',
    'It came out half the size it had been in {a}’s head, and {a} let it go rather than watch it shrink further.',
    '{a} decided that a thing you have to reopen twice was probably never open.',
    'What {a} finally said about it was “forget it,” and {a} meant it this time.',
    '{a} looked at {b} across the hall, ran the whole of it through once more, and let it die where it was.',
    'Some of it {a} still believes. None of it {a} is prepared to spend another evening on.',
    '{a} buried it without ceremony and without telling {b} it had ever been dug up.',
  ],
};

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
  variationAxes: {
    outcome: ['rejected', 'accepted', 'backfire', 'ambiguous'],
    voice: ['temperament', 'boldness', 'social'],
    knowledge: ['witnessed', 'incomplete'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-cold-case-revival');
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW COLD IT WENT, AND HOW MANY TIMES THIS ROOM HAS BEEN ROUND IT. Both
    // read off the stored thread. A story with four beats on it that has gone
    // cold anyway is a story the room is finished with, whatever {a} thinks.
    const heat = heatAt(t, ctx.ep);
    const beats = priorMoments(t, ctx.ep).length;
    const crossesActs = !!(t.act && t.act !== ctx.act);
    const scores = {
      revived: 0.4 + (sa.temperament <= 4 ? 0.25 : 0) + heat * 0.3,
      'answered-at-last': (sb.social / 10) * 0.35 + (sb.temperament / 10) * 0.2,
      // The colder and the more chewed-over it is, the likelier the room has
      // simply stopped caring. That is the arithmetic of the stored record.
      'nobody-cared': Math.max(0, 0.35 - heat * 0.3) + Math.min(3, beats) * 0.1
        + (crossesActs ? 0.2 : 0),
      'put-it-down': (sa.intuition / 10) * 0.25 + Math.max(0, beats - 1) * 0.08,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'revived';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const since = crossesActs ? ` It had been sitting open since ${actPhrase(t.act)}.` : '';
    const sceneWhy = branch === 'answered-at-last' ? 'finally answered a question from days ago'
      : branch === 'nobody-cared' ? 'reopened a story the room had already finished with'
        : branch === 'put-it-down' ? 'heard how old their own grievance had got'
          : 'brought an old suspicion back up';
    const note = lineFor(COLD_CASE_LINES[branch], `susp-cold-case-revival|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, `${note}${since}`, { source: sceneWhy });
    const bondDelta = branch === 'answered-at-last' ? 1
      : branch === 'put-it-down' ? 0.5
        : branch === 'nobody-cared' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (thread && branch === 'answered-at-last') {
      api.resolveArc(thread.id, 'denied-convincingly', { source: sceneWhy });
    }
    if (thread && branch === 'put-it-down') api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    const out = { branch, threadId: thread?.id, cited, bondDelta, acrossActs: crossesActs };
    if (branch === 'put-it-down') {
      // {b} is never told this happened, so {b} is not in the scene. Same
      // reasoning as `susp-pattern-tracking:tracked` above.
      out.actor = a;
    } else {
      out.pair = [a, b];
      out.speaker = a;
      out.respondent = b;
    }
    return out;
  },
});

// ── REWRITE (Task 7 stage 5). `susp-whisper-about-absent:whispered` was on
// the audit's REWRITE list ("one branch — the fork is in the wording, not in
// the game") and on stage 4's blame table for the repetition ceiling. Both
// complaints have one cause and one fix.
//
// SAYING A NAME TO SOMEBODY IS AN OFFER, AND THE OTHER PERSON ANSWERS IT.
// Four answers, four different mornings, and the fork is `{b}`'s — a sharp
// player agrees and adds to it, a strategic one puts a different name back
// across the table, a loyal one will not talk about somebody who is not in
// the room, and an ambitious one takes the read away to use tonight.
//
// The fact underneath every branch is unchanged, and is the one the old
// version cited: `lastClosedThread` on the absent person — how the last
// story about them ENDED, which is a record both people in this kitchen
// watched being made.
const WHISPER_LINES = {
  'compared-notes': [
    '{a} and {b} spent breakfast quietly comparing notes on {c}, who had no idea.',
    'Out of earshot of {c}, {a} told {b} exactly what they thought was going on there, and {b} had the same list.',
    '{a} waited until {c} was out of the room before finishing the sentence, and {b} finished it with them.',
    '{a} and {b} kept their voices under the noise of the kitchen and said {c}\'s name in it twice.',
    '{b} asked what {a} made of {c}, and got a much longer answer than the question deserved, and agreed with all of it.',
    'Neither {a} nor {b} would have said any of it to {c}\'s face, which was rather the point of saying it here.',
  ],
  'named-somebody-else': [
    '{a} said {c}. {b} heard it out, and then said a different name entirely, and made the case for it.',
    '"Not {c}," {b} said. "{c} is loud. Loud is not the same thing." And then {b} said who.',
    '{a} brought {c} to the table and {b} took the conversation somewhere else and would not bring it back.',
    '{b} let {a} finish about {c} and then spent twice as long on somebody {a} had not been watching at all.',
    '{a} and {b} came out of that kitchen with two names between them and no agreement about either.',
    '{b} did not argue that {c} was clean. {b} argued that {c} was not the interesting one.',
  ],
  'would-not-join-in': [
    '{a} started on {c} and {b} would not have it — not while {c} was on the other side of a door.',
    '"Say it to them or don\'t say it," {b} told {a}, and went to get the milk.',
    '{b} listened to about half of what {a} had to say about {c} and then asked {a} to stop.',
    '{a} learned this morning that {b} does not talk about people who are not in the room, and that {b} minds when others do.',
    '{b} did not defend {c}. {b} simply refused to be somebody {a} said that sort of thing to.',
    '{a} got nothing back, and the nothing was pointed enough that {a} did not try again.',
  ],
  'took-it-away': [
    '{b} agreed with every word {a} said about {c}, wrote none of it down, and had all of it by lunchtime.',
    '{a} handed {b} a read on {c} for free. {b} took it, thanked them, and did not offer one back.',
    '{b} said "leave it with me" about {c}, which {a} decided afterwards had not been an agreement at all.',
    '{a} gave {b} the case against {c} and {b} was repeating a tidier version of it to somebody else within the hour.',
    'Whatever {a} thought they were doing, {b} came out of that kitchen with something to spend.',
    '{b} asked two more questions about {c} than the conversation needed and then closed it down.',
  ],
};

registerEvent({
  id: 'susp-whisper-about-absent',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `suspicion|morning`. One is not enough on its own:
  // the pair cooldown is five episodes, so a cell with a single advancer can
  // continue a given pair's story at most once every five rounds.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'strategic', 'loyalty', 'social'],
    knowledge: ['heard-with-source', 'incomplete'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-whisper-about-absent');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    const st = pStats(b);
    const scores = {
      'compared-notes': (st.intuition / 10) * 0.5 + Math.max(0, getBond(a, b)) / 10 * 0.4,
      'named-somebody-else': (st.mental / 10) * 0.4 + (st.strategic / 10) * 0.35,
      'would-not-join-in': (st.loyalty / 10) * 0.5 + Math.max(0, getBond(b, target)) / 10 * 0.4,
      'took-it-away': (st.strategic / 10) * 0.45 + (1 - st.loyalty / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const totalScore = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * totalScore, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-somebody-else' ? 'answered a name with a different name'
      : branch === 'would-not-join-in' ? 'refused to talk about somebody who was not in the room'
        : branch === 'took-it-away' ? 'took a read away without paying for it'
          : 'talked about somebody who was not in the room';
    const bondDelta = branch === 'compared-notes' ? 1.5
      : branch === 'named-somebody-else' ? 0.5
        : branch === 'would-not-join-in' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    let note = lineFor(WHISPER_LINES[branch], `susp-whisper-about-absent|${branch}|${ctx.ep}`,
      { a, b, c: target });
    // SPEC 5.5. Comparing notes on somebody IS remembering how the last story
    // about them ended. No day number here either - see the note in
    // susp-noticed-inconsistency.
    const prior = lastClosedThread(target, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    if (sense === 'walked') note += ` The last time somebody put ${target} on the spot, ${target} had walked away from it, and that was most of what there was to say.`;
    else if (sense === 'cracked') note += ` They kept coming back to the thing that had already come out of ${target} once.`;
    else if (sense === 'coupled') note += ` Half of it was really about who ${target} had been spending their evenings with.`;
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, about: target,
      topic: target, topicKind: 'suspicion-third',
      threadId: thread?.id, cited, bondDelta,
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
    '{b} took it seriously, answered it fully, and did not once get angry, which did all the work.',
    '{b} produced two facts {a} could check and offered to wait while {a} checked them.',
    'It was a good accusation and it did not survive four minutes of {b} being reasonable.',
    '{b} asked {a} to say it again slowly, and it sounded thinner the second time.',
    '{a} believed {b} by the end of it and is not entirely comfortable about believing {b}.',
  ],
  denyWeak: [
    '{b} said the words "that\'s not true" but their voice did something else entirely.',
    '{a} watched {b} deny it, and the denial made {a} more sure, not less.',
    '{b} denied it three times, and nobody had asked twice.',
    '{b} answered the question {a} had not asked, which told {a} everything about the one they had.',
    '{b} said no about six words too late for the no to be worth anything.',
    'The denial was complete, immediate and about the wrong evening.',
    '{b} denied it twice and improved it in between, which is not what a true thing does.',
    '{a} got a no. {a} also got a small pause, and is keeping the pause.',
    '{b} was outraged in the way people are when they have practised being outraged.',
  ],
  turned: [
    '{b} didn\'t answer the accusation — they asked {a} why they were so desperate to make it.',
    'By the end of it, somehow {a} was the one explaining themselves.',
    '{b} let the accusation sit for a second and then asked who had put it in {a}\'s head.',
    'It stopped being about {b} inside a minute, and {a} could not work out when.',
    '{b} answered the accusation with a better one and {a} spent the rest of it defending.',
    '“Where were YOU,” said {b}, and it turned out to be a fair question.',
    '{a} arrived with a case and left having been given one to answer.',
    '{b} did not deny anything. {b} simply changed whose evening was on the table.',
    'By the end of it {a} was explaining a Tuesday, which had not been the plan at all.',
  ],
  confess: [
    '{b} broke, but not about what {a} thought — they admitted to something else entirely.',
    'Cornered, {b} confessed to a different secret altogether, and it landed almost as hard.',
    '{b} gave {a} something true to get out of the room, and it was not the thing {a} came for.',
    '{a} asked one question and {b} answered a heavier one, unprompted, and then looked appalled at themselves.',
    '{b} gave {a} something true that {a} had not asked for and could not now give back.',
    'It came out in one sentence and both of them heard the size of it.',
    '{b} stopped mid-denial and started again with a different verb.',
    '{a} had one question. {b} answered four, and the fourth was the one that mattered.',
    '{b} said it quietly, once, and then would not repeat any of it.',
  ],
};

registerEvent({
  id: 'susp-private-accusation',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'intuition', 'loyalty', 'social', 'temperament'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
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

const TIMELINE_LINES = {
  'did-not-line-up': [
    '{a} and {b} laid out {c}’s account side by side, and it did not line up cleanly.',
    'Neither {a} nor {b} could quite make {c}’s morning add up the way {c} told it.',
    '{a} remembered {c} in the kitchen, {b} remembered {c} nowhere near it, and both of them were sure.',
    '{a} and {b} compared what they knew about {c} and found one unexplained hour in {c}’s account.',
    '{b} walked {a} through where {c} said they had been, and it took two attempts to get to the end of it.',
    '{a} counted it out on their fingers for {b}. The hours were there; {c} was not in all of them.',
  ],
  'checked-out': [
    '{a} and {b} put {c}’s day together hour by hour and every one of them had somebody in it.',
    'It held. {a} had wanted it not to hold, and said so to {b}, and {b} said the same.',
    '{a} and {b} went looking for a gap in {c}’s evening and came out the other end with nothing at all.',
    'Two people crosschecked {c} properly and had to admit, to each other, that {c} was where {c} said.',
    'The account was dull and complete, which {b} pointed out is exactly what an account should be.',
    '{a} and {b} cleared {c} between them and neither of them enjoyed it much.',
  ],
  'lost-the-hour': [
    '{a} and {b} could not agree on what time any of it had been, and gave up on {c} entirely.',
    '{a} and {b} could not agree on their own account of the evening, so {c}’s never stood a chance.',
    'Halfway through {b} realised {b} could not account for {b}’s own hour, which ended the exercise.',
    '{a} and {b} set out to check {c} and spent twenty minutes establishing where the two of THEM had been.',
    'Nobody in this castle wears a watch. {a} and {b} rediscovered that about {c}’s Tuesday.',
    'The whole thing came apart on the question of when dinner had been.',
  ],
  'one-of-us-was-there': [
    '{a} and {b} were checking {c}’s hour when {b} realised {b} had been in it.',
    'It stopped being about {c} the moment {a} worked out that {b} had been in the same corridor.',
    '{a} asked where {c} had been and {b} answered, and then had to explain how {b} knew.',
    'The crosscheck on {c} put {b} somewhere {b} had not previously mentioned being, and {a} noticed.',
    '{b} vouched for {c} rather more precisely than a person who was elsewhere could have.',
    'Two people set out to place {c} and placed {b} instead, and only one of them was pleased about that.',
  ],
};

registerEvent({
  // ── REWRITE (Task 7 stage 5). One branch and one pool, on a broad dawn
  // event: sixth on the blame table. The premise assumed its own answer — the
  // account NEVER lined up — so the event could not report the ordinary case,
  // which is that a crosscheck clears somebody.
  //
  // FOUR OUTCOMES, and the fourth is the one this premise was always going to
  // reach: two people reconstructing a third person’s evening keep putting
  // THEMSELVES into it.
  id: 'susp-timeline-crosscheck',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['mental', 'intuition', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) <= 2 ? 1.5 : 0.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-timeline-crosscheck');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    const sa = pStats(a), sb = pStats(b);
    const scores = {
      'did-not-line-up': (sa.intuition / 10) * 0.4 + (1 - Math.max(0, getBond(a, target)) / 10) * 0.3,
      'checked-out': (sa.mental / 10) * 0.35 + Math.max(0, getBond(a, target)) / 10 * 0.35,
      'lost-the-hour': (1 - sa.mental / 10) * 0.35 + (1 - sb.mental / 10) * 0.25,
      'one-of-us-was-there': (sa.intuition / 10) * 0.3 + (1 - sb.temperament / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'checked-out' ? 'crosschecked somebody and cleared them'
      : branch === 'lost-the-hour' ? 'could not agree what time any of it had been'
        : branch === 'one-of-us-was-there' ? 'found one of themselves inside the hour they were checking'
          : 'crosschecked where people said they were';
    const bondDelta = branch === 'did-not-line-up' ? 0.5
      : branch === 'checked-out' ? 1 : branch === 'lost-the-hour' ? 0 : -1.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(TIMELINE_LINES[branch], `susp-timeline-crosscheck|${branch}|${ctx.ep}`,
      { a, b, c: target });
    // ── "IT DID NOT LINE UP" IS A CLAIM ABOUT TWO ACCOUNTS ──────────────
    //
    // This branch is the causal contract's worked example almost word for word
    // — "CLAIM A: Julia told Gabby she went directly upstairs. CLAIM B: Alec
    // recorded seeing Julia beside the library" — and it was writing neither.
    // The two accounts are the ones `a` and `b` are physically laying side by
    // side in the scene, so they are minted here, about `target`, with both of
    // the people doing the crosschecking as listeners: they are the two the
    // sentence says know both halves, and the reaction radius must be exactly
    // that pair.
    //
    // `checked-out` gets ONE claim and no contradiction, because in that branch
    // the accounts agreed — a second stored claim declaring incompatibility
    // would be the engine writing down something the scene says did not happen.
    if (branch === 'did-not-line-up' || branch === 'one-of-us-was-there') {
      const first = api.recordClaim(target, `${target}'s account of the hour, as ${a} has it`,
        { about: target, listeners: [a, b], channel: 'conversation', source: sceneWhy });
      api.recordClaim(target, `${target}'s account of the hour, as ${b} has it`,
        { about: target, listeners: [a, b], channel: 'conversation', contradicts: [first.id],
          source: `${a} and ${b} hold two accounts of ${target}'s hour that cannot both be true` });
    } else if (branch === 'checked-out') {
      api.recordClaim(target, `${target}'s account of the hour, crosschecked and consistent`,
        { about: target, listeners: [a, b], channel: 'conversation', source: sceneWhy });
    }
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, about: target,
      topic: target, topicKind: 'suspicion-third', threadId: t?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6). Second on the blame table, at 10 of 207 loud
// seasons, and the audit's verdict was MERGE-into-`susp-misread-tell`: "both
// are reading a tell; misread already forks right/wrong, body-read is the
// unforked half of it." The premise survives the merge, because these two
// events are not the same scene once the body-read has a fork of its own —
// `susp-misread-tell` is about a person building something out of NOTHING,
// and this is about a person building something out of a real signal and then
// having to decide what to do with it.
//
// THE RECORD THE FORK READS. `lastClosedThread(b)` — how the LAST story about
// {b} ended, which both of these people watched happen — decides what {a} is
// watching FOR, and it is the same record the single-branch version already
// cited; it now selects the branch set rather than only the adjective. A {b}
// who came apart once (`cracked`) is watched for the second crack and is more
// likely to be asked outright; a {b} who walked away clean (`walked`) is
// watched more carefully and more quietly, because {a} has already learned
// that asking gets a clean answer.
//
// FOUR THINGS A PERSON DOES WITH A TELL THEY HAVE JUST READ:
//
//   read-it            — files it, says nothing. {b} does not know this
//                        happened, so the record names ONE participant.
//   asked-what-it-was  — {a} asks, straight out, and watches the whole answer
//                        rather than listening to it.
//   caught-them-looking— {b} clocks that {a} has been watching. The scene
//                        turns and {b} is the one speaking, so {b} is the
//                        SPEAKER on this branch and {a} answers for it.
//   was-nothing        — the terminal one. {a} watches for the same thing
//                        again, does not get it, and closes their own case.
const BODY_READ_LINES = {
  'read-it': [
    '{a} watched {b}’s hands more than {b}’s words, and did not love what they saw.',
    '{b} talked. {a} watched where {b} was looking while they did it, which was anywhere else.',
    '{a} had stopped listening to {b} some time ago and started watching them instead.',
    'Nothing {b} said was wrong. It was the shoulders, and {a} could not have explained it to anybody.',
    '{a} clocked how carefully {b} was sitting still, and people do not sit that still by accident.',
    '{b} smiled when the room laughed but held it too long, like someone remembering to look normal, and {a} saw it.',
    '{a} watched {b} put a cup down twice before it went where {b} meant it to go.',
    '{b} answered somebody else’s question perfectly well. {a} was not watching the answer.',
    '{a} noticed that {b} had not touched breakfast and had cut all of it up anyway.',
    '{b} laughed with the room and stopped a fraction before the room did, and {a} saw the stop.',
  ],
  'asked-what-it-was': [
    '“You have been doing that with your hands all morning,” {a} said. “What is it.”',
    '{a} did not file it. {a} asked {b} outright what was going on, and then watched instead of listening.',
    '“Are you all right,” {a} asked {b}, and made it a real question rather than a passing one.',
    '{a} named the thing {b} had been doing, out loud, which nobody in a castle ever does.',
    '{a} asked {b} a question {a} already had the answer to, to see what {b} would do with it.',
    '“Sit down,” {a} said to {b}, “and tell me why you cannot.”',
    '{a} put it to {b} plainly and then said nothing at all, which is the part that works.',
    '{a} asked once, got the easy answer, and asked the same thing again in different words.',
  ],
  'caught-them-looking': [
    '{b} looked up and found {a} already looking, and neither of them pretended otherwise.',
    '“You have been watching me since Tuesday,” {b} said to {a}. “Get on with it.”',
    '{b} saw {a} watching them in the window’s reflection and confronted {a} about it.',
    '{a} had been careful about it. Not careful enough — {b} said so, in front of two other people.',
    '{b} moved seats, deliberately, so that {a} would have to turn round to keep doing it.',
    '“What is it you think you can see,” {b} asked {a}, and did not ask it kindly.',
    '{b} had known for a day and a half. {b} chose this morning to say so.',
    '{a} got caught mid-read and gave the worst possible answer, which was no answer.',
  ],
  'was-nothing': [
    '{a} waited for {b} to do it again, all morning, and {b} did not do it again.',
    'It was there on Tuesday and it was gone by Thursday, and {a} was honest enough to say so to {a}.',
    '{a} watched for the same thing four times and got it none of them, and stopped watching.',
    '{a} found out what it actually was, and it was a person sleeping badly, and that was all it was.',
    '{a} had built something on a shoulder. {a} took it apart again, on {a}’s own, without telling anybody.',
    'The tell did not survive a second look. Very few of them do, and {a} knows that about {a}.',
    '{a} gave it one more morning out of stubbornness and let {b} off the hook by lunch.',
    'Everybody sits like that when they are tired. {a} arrived at that eventually, and it cost {a} nothing to arrive.',
  ],
};

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
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'backfire', 'rejected'],
    voice: ['intuition', 'boldness', 'temperament'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 6 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-body-language-read');
    const [a, b] = ctx.actors;
    // SPEC 5.5. What `a` is watching FOR depends on how the last story about
    // `b` ended: a person who came apart once is watched for the next crack.
    const prior = lastClosedThread(b, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'read-it': 0.5 + (sa.temperament / 10) * 0.3,
      // Asking is boldness, and a {b} who has cracked before makes it worth
      // asking — that is the stored outcome doing work, not a mood.
      'asked-what-it-was': (sa.boldness / 10) * 0.4 + (sense === 'cracked' ? 0.35 : 0),
      // Getting caught is {b}'s intuition against {a}'s ability to be quiet.
      'caught-them-looking': (sb.intuition / 10) * 0.4 + (1 - sa.temperament / 10) * 0.25,
      // A {b} who walked clean last time is the one most likely to survive a
      // second look, which is the branch where {a} lets it go.
      'was-nothing': (sa.intuition / 10) * 0.2 + (sense === 'walked' ? 0.3 : 0.1),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'read-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'asked-what-it-was' ? 'asked outright about a thing they had been watching'
      : branch === 'caught-them-looking' ? 'was caught watching somebody'
        : branch === 'was-nothing' ? 'watched for a tell twice and got it once'
          : 'read something in how somebody was sitting';
    const because = branch === 'read-it' && sense === 'cracked'
      ? ` ${a} had seen ${b} come apart once already and was waiting for it to happen twice.`
      : branch === 'read-it' && sense === 'walked'
        ? ` Whatever ${b} did the last time somebody asked had worked, and ${a} wanted to know how.`
        : '';
    const note = lineFor(BODY_READ_LINES[branch],
      `susp-body-language-read|${branch}|${ctx.ep}|${sense}`, { a, b });
    const bondDelta = branch === 'caught-them-looking' ? -1.5
      : branch === 'asked-what-it-was' ? -1
        : branch === 'was-nothing' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, `${note}${because}`,
      { source: sceneWhy });
    // THE TERMINAL OUTCOME. A tell that does not survive a second look is a
    // story that ended, and `passed-clean` is what it ended as.
    if (branch === 'was-nothing' && thread) {
      api.resolveArc(thread.id, 'passed-clean', { source: sceneWhy });
    }
    const out = { branch, threadId: thread?.id, cited, bondDelta,
      priorOutcome: prior?.outcome ?? null };
    if (branch === 'asked-what-it-was') {
      out.pair = [a, b]; out.speaker = a; out.respondent = b;
    } else if (branch === 'caught-them-looking') {
      // THE DIRECTION FLIPS HERE, and that is the whole branch. {b} is the one
      // speaking, so {a} is the person being answered for — the same shape as
      // stage 5's `susp-alliance-shape-guess:put-each-other-on-it`.
      out.pair = [a, b]; out.speaker = b; out.respondent = a;
    } else {
      out.actor = a;
    }
    return out;
  },
});

// ── REWRITE (Task 7 stage 5). Fourth on the blame table. It had two branch
// LABELS — `shape-guessed` and `shape-redrawn` — but one scene: whether an
// arc already existed changed the word on the record and nothing a viewer
// could see. The pool was one six-line list serving both.
//
// FOUR THINGS THAT HAPPEN WHEN TWO PEOPLE DRAW THE ROOM, and one of them is
// the one this event was always going to have to reach eventually: the map
// has the person you are drawing it with on it.
//
//   agreed-the-map    — they get to one shape and both believe it.
//   could-not-place-one — the map works except for one person, and the
//                       exception is the interesting part.
//   put-each-other-on-it — {b} works out that {a} has drawn {b} into a group
//                       {b} is not in, and says so. This is where the scene
//                       turns.
//   redrew-it         — they already had a map and this one is different,
//                       which is only possible when the arc exists.
//   drew-it-alone     — THE SOLO BRANCH, for the window’s 0.51-per-solo-draw
//                       problem. One person drawing the room has nobody to
//                       move the lines, which is exactly what is wrong with it.
const SHAPE_GUESS_LINES = {
  'agreed-the-map': [
    '{a} and {b} sketched out, in whispers, who they thought was actually working together.',
    'They agreed on the shape of it, {a} and {b} — a middle, an outside, and no argument about either.',
    '{a} asked {b} who they would put in a room together if they wanted to hear something true, and got the same three names {a} had.',
    'Between them, {a} and {b} built a map of the castle out of who sat where at breakfast, and it held up.',
    '{b} said a name. {a} said a second one and did not have to explain the connection.',
    '{a} named three people to {b} and drew a line between two of them, and {b} agreed with the line.',
  ],
  'could-not-place-one': [
    '{a} and {b} got the whole castle onto the map except one person, and stopped there for an hour.',
    'Everybody fitted somewhere. One name would not sit anywhere {a} or {b} put it.',
    '"Where does that leave them, then," {b} said, and {a} did not have an answer, and neither did {b}.',
    'The map {a} and {b} built had a hole in it exactly one person wide.',
    '{a} and {b} agreed on every group in the room and could not agree which one contained the one that mattered.',
    'It was a good map. {b} kept coming back to the single name that was not on it.',
  ],
  'put-each-other-on-it': [
    '{a} drew the room for {b} and put {b} in a group {b} is not in, and {b} said so.',
    '"You’ve got me with them," {b} said, quietly. "Is that where you actually have me?"',
    '{a} was three names into the map before {a} realised {b} had gone very still about one of them.',
    '{b} let {a} finish the whole shape and then asked, pleasantly, which part of it {b} was in.',
    'The map had {b} on it, and {a} had not thought about how that was going to sound out loud.',
    '{a} found out this evening that {b} does not enjoy being drawn.',
  ],
  'redrew-it': [
    '{a} and {b} had a shape for the castle a week ago and spent tonight taking it apart.',
    'The map {a} and {b} had built did not survive this week, and they built another one.',
    '"That was before," {b} said, moving two names, and {a} could not argue with either move.',
    '{a} and {b} started from the old shape and finished somewhere that did not look like it at all.',
    'Two people who had already agreed once found out they no longer did, and redrew it rather than fight about it.',
    'It took {a} and {b} about ten minutes to establish that the room had changed underneath their map.',
  ],
  'drew-it-alone': [
    '{a} drew the whole room in {a}’s head, with nobody there to move a single line.',
    'Nobody to check against, so {a} worked out who trusts whom alone and had to take {pos} own word for it.',
    '{a} worked out who was with whom and got a shape {a} could not test on anybody.',
    'It is easy to be certain about a room when there is nobody in it to disagree with you, and {a} was certain.',
    '{a} put the castle into three groups and spent the rest of the evening moving one name between two of them.',
    '{a} had a map by the end of the evening and no idea whether any of it was true.',
    'The trouble with drawing it alone is that {a} could not tell which lines {a} had put there because they were there.',
    '{a} went through the room in pairs, in {a}’s head, and found more pairs than the castle probably has.',
    'By bedtime {a} had a whole architecture of the place, built out of who had said good morning to whom.',
    '{a} would have liked somebody to argue with about it and could not think of anybody safe to ask.',
    '{a} drew it once quickly and once slowly and got two different castles out of it.',
    'Every group {a} came up with had one person in it who did not belong there.',
    '{a} kept putting the same two names together and could not remember what for.',
    'The map got smaller every time {a} did it, which {a} decided was either clarity or exhaustion.',
    '{a} tried building it from the outside in for a change, and the middle came out empty.',
    'By the end {a} had sorted everyone into four groups and could not work out which group {a} belonged to.',
    '{a} thought about writing it down and remembered what a written-down thing is worth here.',
    'It is the sort of thing that is obvious at eleven at night and gone by breakfast, and it was.',
    '{a} drew it out in the condensation on a window and then wiped the window.',
    'Four names, two arrows and a question mark, and {a} could not make the question mark go away.',
    '{a} has a shape for this castle now. It is almost certainly the wrong shape.',
    'Everybody who eats together is a bloc if you look at it long enough, and {a} looked at it long enough.',
    '{a} put one person in two places on the map and could not decide which to remove.',
    'The map is very tidy and {a} does not believe a word of it in the morning.',
    '{a} worked out who sits where and then worked out that people sit where there are chairs.',
    'It took an hour and produced three names {a} already had, which {a} chose to find reassuring.',
  ],
};

registerEvent({
  id: 'susp-alliance-shape-guess',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['strategic', 'intuition', 'temperament'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    // WIDENED TO A SOLO DRAW (Task 7 stage 5) — see the header.
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return ctx.actors.length === 1 ? 1.2 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-alliance-shape-guess');
    const [a, b] = ctx.actors;
    if (!b) {
      const soloWhy = 'drew the shape of the room with nobody to check it';
      const t = api.openArc(FAMILY, [a], { source: soloWhy,
        seed: lineFor(SHAPE_GUESS_LINES['drew-it-alone'], `susp-alliance-shape-guess|drew-it-alone|${ctx.ep}`, { a }) });
      return { branch: 'drew-it-alone', actor: a, threadId: t?.id, bondDelta: 0 };
    }
    const existing = findOpenThread(FAMILY, [a, b]);
    const st = pStats(b);
    // THE ARC DECIDES WHETHER `redrew-it` EXISTS — two people cannot redraw a
    // map they have never drawn — and the stats decide among the rest. Same
    // rule the stage-4 library uses: the record picks the set.
    const scores = {
      'agreed-the-map': (st.strategic / 10) * 0.4 + Math.max(0, getBond(a, b)) / 10 * 0.35,
      'could-not-place-one': (st.intuition / 10) * 0.45 + 0.15,
      'put-each-other-on-it': (st.temperament / 10) * 0.2 + (1 - Math.max(0, getBond(a, b)) / 10) * 0.4,
      'redrew-it': existing ? (st.mental / 10) * 0.4 + 0.4 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'could-not-place-one' ? 'could not fit one person onto the map'
      : branch === 'put-each-other-on-it' ? 'drew the other one into a group they say they are not in'
        : branch === 'redrew-it' ? 'took a map they had already agreed and rebuilt it'
          : 'guessed at the shape of the room';
    const bondDelta = branch === 'agreed-the-map' ? 1
      : branch === 'could-not-place-one' ? 0.5 : branch === 'put-each-other-on-it' ? -1.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(SHAPE_GUESS_LINES[branch], `susp-alliance-shape-guess|${branch}|${ctx.ep}`, { a, b });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // ON `put-each-other-on-it` THE ANSWERER TAKES THE SCENE OVER, and the
    // blanket [a, b] direction handed the reaction card to the wrong one.
    // Found by reading a rendered day: {b} objects to having been drawn into a
    // group, which makes {a} -- who drew the map -- the person now answering
    // for it, and the screen was giving the defensive line to {b}. Same shape,
    // and same fix, as `saw-through-it` in js/tr/castle/testing.js.
    const bTakesIt = branch === 'put-each-other-on-it';
    return { branch, pair: [a, b], speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: t?.id, bondDelta };
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
// ── REWRITE (Task 7 stage 6). The audit's verdict was MERGE into
// `susp-group-pressure-crack`, and that merge has been honoured there — the
// premise is now a real branch of the pressure event. This event keeps its
// registration (an `after-table` scene is worth more than a tidy registry) and
// earns it by being the OTHER half of the same idea: over-explaining to a room
// is a performance, and over-explaining to ONE person, quietly, in a corridor,
// is a confession looking for somewhere to happen. The room's version is
// public and costs {b} the room. This one costs {b} exactly one witness, and
// what that witness does with it is the fork.
//
// THE RECORD THE FORK READS. `suspicion(a, b, ep)` — what {a} already thinks,
// which the weight already required to be non-zero — and how the last story
// about {b} ended. A person who has already been suspected and has already
// talked their way out of it once over-explains differently, and {a} hears it
// differently, and neither of those is invented here: both are looked up.
const OVERCORRECT_LINES = {
  overcorrected: [
    '{b} explained themselves to {a} for far longer than the question actually required, and it did not help.',
    '{a} asked something almost polite and got back a defence nobody had requested.',
    '{b} gave {a} an alibi for a morning {a} had not mentioned, which was the first {a} had heard of any of it.',
    'Every extra sentence {b} added made the first one look worse, and {b} kept adding them.',
    '{b} answered, and then answered again, and then answered a third time in case {a} had missed it. {a} had not.',
    '{a} said “sure” twice and {b} carried on for another minute after the second one.',
    '{b} accounted for four hours {a} had not asked about and could not now stop accounting for.',
    'It was a question about a cup of tea. {b} answered it with a timetable.',
  ],
  'caught-themselves': [
    '{b} heard it happening halfway through, stopped dead, and the stopping was worse than the sentence.',
    '{b} got three sentences in, realised {a} had only asked one thing, and said “sorry — anyway.”',
    'There was a moment where {b} could see exactly what {b} sounded like, and {a} watched {b} see it.',
    '{b} shut their own mouth mid-alibi, which is a thing {a} has never once seen an innocent person do.',
    '{b} laughed at themselves for going on about it and then did not say another word all morning.',
    'The correction stopped abruptly. Neither {a} nor {b} pretended the stop had not happened.',
    '{b} apologised for explaining, which was somehow more explaining.',
    '{b} ran out of it in front of {a} and had nowhere to put the silence afterwards.',
  ],
  'it-worked': [
    '{b} buried {a} in it, and somewhere under all that detail {a} decided {b} was probably just anxious.',
    'It was too much and it was also, in the end, convincing, which {a} did not enjoy.',
    '{a} came in with a doubt and left with a timetable and no doubt at all.',
    '{b} over-answered so thoroughly that {a} could not find the join, and gave up looking for one.',
    'Nobody lies with that many verifiable details, {a} thought, which is exactly what {b} had been counting on or was not.',
    '{a} checked two of the four things {b} had volunteered. Both of them held.',
    '{b} said far too much and every word of it was true, and {a} could tell.',
    '{a} went away satisfied and slightly embarrassed about having asked.',
  ],
  'nobody-asked-you': [
    '“I did not ask you that,” {a} said, in the middle of it, and {b} had no answer for the not-asking.',
    '{a} let {b} finish and then repeated the original question, which had been about something else.',
    '“Why do you know where you were at four,” {a} asked, and {b} did not know why {b} knew.',
    '{a} named it out loud — the volume of it, the detail of it — and named it in front of one other person.',
    '{a} counted the alibis {b} had given for hours nobody cared about, out loud, on their fingers.',
    '{b} was still going when {a} said, quite pleasantly, “that is a lot.”',
    '{a} did not accuse {b} of anything. {a} asked {b} why {b} was defending themselves.',
    '“You are answering a question I have not asked yet,” {a} said, and let it sit there.',
  ],
  'let-it-go': [
    '{a} decided, somewhere in the third paragraph, that this was a frightened person and not a careful one.',
    '{b} over-explained and {a} let {b} have it, because everybody here explains too much by day six.',
    '{a} has done exactly this, on a bad morning, and recognised it, and put the doubt down.',
    'It was too much. It was also, {a} thought, the wrong kind of too much for somebody with something to hide.',
    '{a} listened to all of it, said “I know,” and meant it, and that was the end of that one.',
    '{a} came away thinking less of {b}’s nerves and nothing at all about {b}’s alignment.',
    'A liar edits. {b} did not edit, and {a} noticed the not-editing.',
    '{a} let the whole thing drop before lunch and did not mention it to a soul.',
  ],
};

registerEvent({
  id: 'susp-defensive-overcorrect',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['ambiguous', 'backfire', 'rejected', 'accepted'],
    voice: ['temperament', 'intuition', 'social'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (suspicion(a, b, ctx.ep) <= 0) return 0;
    return pStats(b).temperament <= 4 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-defensive-overcorrect');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // WHAT {a} ALREADY THINKS, looked up. The weight has already required it
    // to be positive; the SIZE of it decides how much benefit of the doubt is
    // left to spend.
    const doubt = suspicion(a, b, ctx.ep);
    const prior = lastClosedThread(b, { beforeEp: ctx.ep });
    const talkedOut = outcomeSense(prior?.outcome) === 'walked';
    const scores = {
      overcorrected: 0.45 + doubt * 0.1,
      'caught-themselves': (sb.intuition / 10) * 0.4,
      // Somebody who has already talked their way out of one story is the
      // person best placed to do it twice. That is the stored outcome working.
      'it-worked': (sb.social / 10) * 0.35 + (talkedOut ? 0.3 : 0) - doubt * 0.05,
      'nobody-asked-you': (sa.boldness / 10) * 0.3 + doubt * 0.12,
      'let-it-go': (sa.temperament / 10) * 0.3 - doubt * 0.08,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'overcorrected';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'caught-themselves' ? 'heard themselves over-explaining and stopped'
      : branch === 'it-worked' ? 'buried a doubt under more detail than it could carry'
        : branch === 'nobody-asked-you' ? 'was asked why they were defending themselves'
          : branch === 'let-it-go' ? 'was over-explained at and decided it was nerves'
            : 'defended themselves harder than the question needed';
    const note = lineFor(OVERCORRECT_LINES[branch], `susp-defensive-overcorrect|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'it-worked' ? 0.5
      : branch === 'let-it-go' ? 1
        : branch === 'nobody-asked-you' ? -1.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    // TWO TERMINAL OUTCOMES. Detail that lands closes the story as
    // `denied-convincingly`; a doubt {a} simply puts down closes as `buried`,
    // because nobody else ever knew it had been picked up.
    if (thread && branch === 'it-worked') {
      api.resolveArc(thread.id, 'denied-convincingly', { source: sceneWhy });
    }
    if (thread && branch === 'let-it-go') api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: thread?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6), AND THE AUDIT'S MERGE FOLDED IN ─────────
//
// TOP OF THE BLAME TABLE at 12 of 207 loud seasons — the single loudest
// remaining source of within-season repetition in the castle. The audit had
// this as a KEEP on three branches, and it is the clearest case in the pool of
// why a KEEP is not "no work": three branches with four-line pools each, on an
// event that fires 1.5 times a season in a window that now runs at 5.8 scenes
// an episode, is twelve sentences carrying the whole of the room's biggest
// scene.
//
// Both terms of `C(F,3)/P^2` are attacked. Three branches become SIX, and
// every pool goes from four lines to nine or ten. The event already draws
// through `pick(rng, ...)`, which takes exactly one draw regardless of pool
// length, so the widening is free and the firing tables do not move.
//
// THE AUDIT'S MERGE, HONOURED AS A BRANCH. `susp-defensive-overcorrect`'s
// verdict was MERGE INTO THIS ONE — "overcorrecting under pressure is a fourth
// branch of the pressure event, not a separate scene" — and it now is one.
// That event stays registered and is separately rewritten below, on the same
// reasoning stage 5 used for `trust-circle-forms`: an `after-table` scene is
// worth more than a tidy registry, and the two stop being interchangeable the
// moment each has a fork of its own.
//
// SIX ANSWERS TO A ROOM LEANING ON YOU:
//
//   holds                   — takes all of it and does not move.
//   cracks                  — comes apart in public.
//   redirects               — hands the room a better name than their own.
//   overcorrected           — answers far more than was asked, and each extra
//                             sentence makes the first one look worse.
//   walked-away             — refuses to be questioned at all and leaves. A
//                             terminal outcome: `turned-back`.
//   admitted-something-else — cracks sideways, and gives up a real thing that
//                             is not the thing anybody asked about. Terminal:
//                             `confessed-unrelated`.
const GROUP_PRESSURE_LINES = {
  holds: [
    '{b} took the whole room leaning on them and didn’t budge an inch.',
    'Six people staring at {b} at once, and {b} just waited them out.',
    'The room asked {b} the same thing four different ways and got the same answer four times.',
    '{b} let the questions pile up and then answered the first one, calmly, as if the rest had not happened.',
    '{b} answered {a}, and only {a}, and let the rest of the room talk to the back of their head.',
    'It went on for a quarter of an hour. {b} did not once raise their voice or change a word of it.',
    '{b} said “no” four times in a row and did not decorate any of them.',
    'The room ran out of ways to ask before {b} ran out of the same answer.',
    '{b} finished their tea in the middle of it, which did more than anything {b} said.',
  ],
  cracks: [
    '{b} folded under the group pressure fast, and it showed.',
    'It took less than a minute for {b} to start contradicting themselves.',
    '{b} started explaining before anyone had actually accused them of anything.',
    'Somewhere in the third answer {b} stopped talking to the room and started talking to themselves.',
    '{b} got two sentences in, heard how the second one sounded, and could not get to a third.',
    'The room did not even have to press. {b} came apart in front of the first easy question {a} asked.',
    '{b}’s voice went, and everybody in the room heard exactly where it went.',
    '{b} said “that is not what I meant” three times and never once said what they had meant.',
    '{b} looked at {a} for help and got none, and the not-getting-any was the worst of it.',
  ],
  redirects: [
    '{b} took the group’s pressure and pointed it at somebody else entirely.',
    'By the end, the room had forgotten it was ever asking {b} anything.',
    '{b} answered a question about themselves with a question about somebody else, and the room chased it.',
    '{b} handed the room a better target than themselves, and the room took it without noticing the trade.',
    '{b} agreed with {a} completely, and then said the name of a person who had not been in the conversation.',
    '“Ask me after you have asked the person who was actually upstairs,” {b} said, and the room went upstairs.',
    '{b} gave the room something true about somebody else, which is the cheapest way out of a room there is.',
    'It took {b} one sentence to stop being the subject of the evening.',
    '{b} did not defend themselves at all. {b} prosecuted somebody, which the room found much more interesting.',
  ],
  overcorrected: [
    '{b} explained themselves for far longer than the question actually required, and it did not help.',
    '{a} asked something almost polite and got back a defence nobody had requested.',
    '{b} gave the room an alibi for a morning nobody had mentioned, which was the first anybody had heard of it.',
    'Every extra sentence {b} added made the first one look worse, and {b} kept adding them.',
    '{b} answered, and then answered again, and then answered a third time in case the room had missed it. It had not.',
    '{b} produced a level of detail about a Tuesday that no innocent person has ever had about a Tuesday.',
    'Nobody had asked where {b} was. {b} told them anyway, twice, with times.',
    '{b} kept going long after {a} had stopped wanting an answer, and neither of them noticed who stopped listening first.',
    'The room believed {b} up until about the fourth clarification.',
  ],
  'walked-away': [
    '{b} stood up in the middle of it and left, and the room had to decide what that meant on its own.',
    '“I am not doing this tonight,” {b} said to {a}, and went, and did not come back down.',
    '{b} listened to two questions, said none of it was a question, and walked out of the hall.',
    '{b} refused the whole shape of it — not the accusation, the sitting there — and left the room mid-sentence.',
    'The room got about a third of the way in before {b} decided the room had no right to any of it.',
    '{b} put a chair back under the table very carefully and then was not in the room any more.',
    '“You can have this conversation without me,” {b} said. The room did, at length.',
    '{b} went, and the argument about whether going was an answer lasted longer than the questions had.',
    '{a} asked {b} to sit back down. {b} did not sit back down.',
  ],
  'admitted-something-else': [
    '{b} did not crack on the thing the room was asking about. {b} cracked on a different thing entirely.',
    'Under all of it {b} gave up something real, and it was not what anybody had come for.',
    '“Fine — I made a deal on the second night,” {b} said, which nobody had asked about and everybody now knew.',
    '{b} answered a question the room had not put and could not now un-hear.',
    'The pressure found a seam. It was not the seam {a} had been leaning on.',
    '{b} confessed, at some length, to the wrong crime, and the room took it anyway.',
    'What came out of {b} was true, unrelated, and much more useful than the answer would have been.',
    '{b} traded a real secret for the end of the conversation, and it worked, and it will cost.',
    '{b} said one honest sentence about something else and the whole room went quiet for it.',
  ],
};

registerEvent({
  id: 'susp-group-pressure-crack',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'boldness', 'strategic', 'social'],
    relationship: ['rival', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 5) return 0;
    const t = findOpenThread(FAMILY, ctx.actors);
    return t ? 2 : 0.75;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-group-pressure-crack');
    const sceneWhy = 'was leaned on by the room';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // THE ARC IS A TERM, NOT DECORATION. A room that has been round this
    // before with {b} is a room {b} is likelier to walk out of, and a person
    // with a story already open is likelier to give up a different one to end
    // it. `heatAt` is the stored record of how live that story is.
    const existing = findOpenThread(FAMILY, ctx.actors);
    const heat = existing ? heatAt(existing, ctx.ep) : 0;
    const scores = {
      holds: (st.temperament / 10) * 0.5 + (st.boldness / 10) * 0.3 + 0.1,
      cracks: (1 - st.temperament / 10) * 0.6 + 0.1,
      redirects: (st.strategic / 10) * 0.4 + (st.social / 10) * 0.3,
      overcorrected: (1 - st.temperament / 10) * 0.3 + (1 - st.boldness / 10) * 0.25,
      'walked-away': (st.boldness / 10) * 0.25 + (1 - st.social / 10) * 0.2 + heat * 0.25,
      'admitted-something-else': (1 - st.loyalty / 10) * 0.25 + heat * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'holds';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const line = pick(rng, GROUP_PRESSURE_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const bondDelta = branch === 'holds' ? 0.5
      : branch === 'cracks' ? -2
        : branch === 'redirects' ? -1
          : branch === 'overcorrected' ? -1
            : branch === 'walked-away' ? -2.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, ctx.actors, { source: sceneWhy, seed: line });
    // TWO TERMINAL OUTCOMES, which the event did not have at all. Walking out
    // of the room turns the question back on the room (`turned-back`, sense
    // `walked`); giving up a different secret is a crack (`confessed-
    // unrelated`, sense `cracked`).
    if (t && branch === 'walked-away') api.resolveArc(t.id, 'turned-back', { source: sceneWhy });
    if (t && branch === 'admitted-something-else') {
      api.resolveArc(t.id, 'confessed-unrelated', { source: sceneWhy });
    }
    // THE DIRECTION IS THE EVENT'S, NOT THE BRANCH'S: the room asks through
    // {a} and {b} answers, on every one of the six, including the two where
    // {b}'s answer is to stop answering.
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

// THE EVENT THIS TASK IS NAMED AFTER. It printed one sentence, and season
// seed=3 printed it in episodes 1, 4, 8 and 10 — four identical lines in one
// castle. Task 5 widened its cooldown to three episodes, which took the worst
// season from four firings to three and was palliative. Plan 5 Task 8 gave it
// a seven-line pool. This is the rest of the fix.
//
// ── REWRITE (Task 7 stage 6). The audit: "2 branches, short of four
// materially different paths" — and the two it had were the same scene with
// the actor's mood written on the label. What was missing is the second half
// of the premise: a theory built out of nothing is not finished when it is
// built. It goes somewhere, and the four places it can go are four different
// scenes with four different prices.
//
// THE FACT UNDERNEATH IS THE ABSENCE OF ONE, and that has not changed —
// `suspicion(a, b, ep) > 0` still disqualifies the pair, so every branch below
// is a person with no read at all doing something about a read they have
// invented. What the branches read is {a}: temperament and the state the last
// table left them in (both stored), and whether the castle is small enough
// that saying it out loud reaches everybody.
//
//   misread-calm / misread-nervy — {a} keeps it. The state stays on the label
//                       for the reason the earlier version gave: somebody the
//                       room came for last night inventing evidence is not the
//                       same scene as somebody comfortable doing it.
//   told-somebody     — the theory acquires a second holder, {c}, and {c} did
//                       not ask for it.
//   asked-them        — {a} takes it to {b}, which is the only branch where
//                       {b} finds out any of this is happening.
//   heard-it-out-loud — {a} says it, hears it, and stops. Terminal: `buried`.
const MISREAD_LINES = {
  misread: [
    '{a} clocked a completely harmless habit of {b}’s and decided it meant something.',
    '{b} does that thing with their sleeve when they are bored. {a} has decided it is not boredom.',
    '{a} watched {b} straighten the same sleeve twice and mistook the nervous habit for guilt.',
    'It was the way {b} said good morning. {a} could not have told you what was wrong with it, only that something was.',
    '{b} laughed a beat late at something and {a} built an entire theory on the beat.',
    '{a} decided {b} blinks too much when {b} is lying, having never once seen {b} lie.',
    '{b} sat with their back to the door, the way {b} has sat since the first night, and {a} noticed it for the first time and hated it.',
    '{a} has decided that {b} says {a}’s name too often, and has started counting.',
    '{b} takes the same seat every morning. This morning {a} decided that was a choice.',
    '{a} could not have picked {b} out of the room on day one and has now got four days of evidence about them.',
  ],
  'told-somebody': [
    '{a} took the theory to {c} before breakfast, and {c} has it now whether {c} wanted it or not.',
    '“Watch {b}’s hands,” {a} said to {c}, and {c} did, all morning, and saw hands.',
    '{a} said it out loud to {c} — the sleeve, the laugh, all of it — and it sounded much better out loud.',
    '{c} had no opinion about {b} at all until nine o’clock this morning.',
    '{a} needed one other person to see it, and {c} was the person standing there.',
    '{a} gave {c} a theory about {b} and asked {c} not to repeat it, which is how a theory travels.',
    'By lunch there were two people watching {b} do an ordinary thing, and only one of them had started it.',
    '{a} told {c} it was probably nothing, four separate times, while describing all of it.',
  ],
  'asked-them': [
    '{a} put it straight to {b}, and {b} had no idea what {a} was even describing.',
    '“Why do you do that with your sleeve,” {a} asked, and {b} said “what sleeve,” and meant it.',
    '{a} asked {b} about a mannerism {b} has had since childhood and watched {b} try to account for it.',
    '{b} was asked to explain something {b} did not know {b} did, and did it badly, which helped nobody.',
    '{a} named the tell out loud to {b}. {b} laughed. {a} did not.',
    '“You know you look at the door every time somebody says my name,” {a} said, and {b} looked at the door.',
    '{a} got an honest, baffled answer and could not decide whether baffled was worse.',
    '{b} asked {a} whether {a} was all right, which was not the direction {a} had planned for it.',
  ],
  'heard-it-out-loud': [
    '{a} said the whole theory out loud, alone, and it did not survive being said.',
    'It was a sleeve. {a} got there in the end, on {a}’s own, and was embarrassed about the route.',
    '{a} rehearsed telling somebody, heard the first sentence of it, and did not tell anybody.',
    '{a} tried to work out what {b} would actually have to be doing for the habit to mean it, and could not.',
    '{a} has been wrong like this before and recognised the taste of it in time.',
    '{a} put the whole thing down before breakfast and did not pick it back up.',
    'The theory needed {b} to be cleverer than anybody in this castle, and {a} decided nobody here is.',
    '{a} spent an hour on it and then decided that an hour on a sleeve is a thing to be worried about in oneself.',
  ],
};

registerEvent({
  id: 'susp-misread-tell',
  family: FAMILY,
  window: 'morning',
  advancesThread: true,
  variationAxes: {
    outcome: ['ambiguous', 'backfire', 'rejected'],
    voice: ['temperament', 'social', 'intuition'],
    knowledge: ['incomplete'],
  },
  // ACT: OPENING. Deciding a harmless habit means something is what suspicion
  // looks like when there is no evidence yet. Late in a season the room has
  // ballots, timelines and bodies to argue from, and does not need a habit.
  acts: { early: 1.6, late: 0.5 },
  // COOLDOWN OVERRIDE, AND THIS ONE WAS FOUND BY READING A DUMPED SEASON.
  // The original `fire()` wrote ONE line with no pool behind it, so every
  // firing was the same sentence with different names in it. Season seed=3
  // printed it in episodes 1, 4, 8 and 10 — four identical sentences in one
  // castle. Widened to three episodes, and the cooldown STAYS now that both
  // the pool and the branch set have been fixed, because the argument for it
  // was never really the sentence: somebody inventing a tell out of a
  // mannerism twice in three days is one person behaving oddly, not two beats
  // of a story.
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-misread-tell');
    const [a, b] = ctx.actors;
    const state = ctx.state?.[a] || 'content';
    // NERVY, not the raw state: `desperate` on its own reads 6 firings per 400
    // seasons, which is inside the noise the branch floor sits in. Paranoid
    // and desperate are the same scene from the reader's side — somebody the
    // room came for last night, inventing evidence — and that is the split
    // worth labelling. The raw state still varies the sentence.
    const nervy = isNervy(state);
    const sa = pStats(a);
    const third = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = third.length ? third[Math.floor(rng() * third.length)] : null;
    const scores = {
      misread: 0.5 + (nervy ? 0.3 : 0),
      // A theory travels through somebody sociable, and it needs somebody to
      // travel to — read off the living roster, not assumed.
      'told-somebody': c ? (sa.social / 10) * 0.4 + (nervy ? 0.15 : 0) : 0,
      'asked-them': (sa.boldness / 10) * 0.35 - (nervy ? 0.1 : 0),
      // Hearing yourself is what a settled, self-aware person does with it.
      'heard-it-out-loud': (sa.intuition / 10) * 0.25 + (nervy ? 0 : 0.2),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'misread';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'told-somebody' ? 'gave somebody else a theory built out of nothing'
      : branch === 'asked-them' ? 'asked somebody to account for a habit they did not know they had'
        : branch === 'heard-it-out-loud' ? 'said a theory out loud and heard what it was'
          : 'read a tell that may not have been one';
    const note = lineFor(MISREAD_LINES[branch], `susp-misread-tell|${branch}|${ctx.ep}|${state}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'asked-them' ? -1
      : branch === 'heard-it-out-loud' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'told-somebody' && c) api.addBond(a, c, 0.5, { source: sceneWhy });
    const { thread } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    // THE TERMINAL OUTCOME. A theory that does not survive being said aloud is
    // a story that ended without anybody else ever knowing it started.
    if (thread && branch === 'heard-it-out-loud') {
      api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    }
    const out = { branch: branch === 'misread' ? (nervy ? 'misread-nervy' : 'misread-calm') : branch,
      threadId: thread?.id, bondDelta, state };
    if (branch === 'asked-them') {
      out.pair = [a, b]; out.speaker = a; out.respondent = b;
    } else if (branch === 'told-somebody') {
      out.pair = [a, c]; out.speaker = a; out.respondent = c;
    } else {
      out.actor = a;
    }
    return out;
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
    '{a} counted the doors between the noise and {a}’s own, twice, and got a different answer twice.',
    'It stopped the moment {a} got up, which is either nothing or everything.',
    '{a} stood in the corridor in the dark for a full minute and heard a building settling.',
    'There is somebody awake in this castle at three in the morning and {a} would like to know who.',
    '{a} went back to bed and then got up again to check the same door, which is a bad sign.',
    'By morning {a} was not certain any of it had happened, and was certain enough to be tired.',
    '{a} listened until the listening was the loudest thing in the room.',
    'It was probably the wind. {a} has decided against the wind on no evidence at all.',
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
