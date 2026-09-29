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
import { lineFor, pronounSlots } from './lines.js';

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
    '{a} notices that {b}’s story about last night has changed since this morning.\n{a}: "Where did you say you were last night?"\n{b}: "The library. Why?"\n{a} (to camera): "This morning {b} said the kitchen. Just now it was the library. Small thing. I’m keeping it."',
    '{b} answers a simple question a bit too quickly, and {a} notices.\n{a}: "What time did you go up?"\n{b}: "Eleven. Why do you ask?"\n{a} (to camera): {cam:holding-info}',
    '{a} and {b} are chatting when {b} gets a detail about yesterday wrong.\n{b}: "I was with you, remember?"\n{a}: "Were you? I thought you were upstairs."\n{b}: "No, I was — never mind."\n{a} lets it go, for now.',
    '{a} asks {b} something harmless about last night, and doesn’t like the answer.\n{a}: {say:ask-where}\n{b}: {say:answer-shaky}\n{a}: "Right. Okay."',
    '{b} mentions going up to bed early. {a} is sure {aSub} saw {bObj} downstairs later.\n{b}: "I was in bed by ten, easy."\n{a}: "Were you?"\n{a} (to camera): "Either I’m wrong about the time, or {b} is lying about it. I don’t think I’m wrong."',
  ],
  'asked-about-it': [
    '{a} doesn’t let it go. {a} asks {b} straight out.\n{a}: "This morning you said you went straight up. Now you’re saying the kitchen. Which was it?"\n{b}: "Both? I went to the kitchen, then up."\n{a}: "You didn’t say that this morning."\n{b}: "Because you didn’t ask this morning."',
    '{a} puts it to {b} right there.\n{a}: {say:ask-where}\n{b}: {say:answer-clean}\n{a}: "Earlier you told it differently."\n{b}: "Did I? Then I told it badly. That’s all."',
    '{a} catches the mistake and asks about it on the spot.\n{a}: "Hang on. You were in the hall, or upstairs?"\n{b}: "Does it matter?"\n{a}: "It does to me."\n{b}: "Upstairs. Happy?"',
    '{a} asks {b} about it, calmly, and watches the whole answer.\n{a}: "Something you said doesn’t match. I’m just asking."\n{b}: {say:deny}\n{a}: "Okay. I just wanted to hear you say it."',
  ],
  'let-it-pass': [
    '{a} notices {b}’s story has a gap in it, and decides it’s just a bad memory.\n{b}: "I think I went up after the fire. Or before? I don’t know."\n{a}: "Doesn’t matter."\n{a} (to camera): {cam:drop-it}',
    '{a} nearly says something about {b}’s story, and stops.\n{b}: "…and then I went straight up."\n{a}: "Right."\n{a} (to camera): "I get my own evenings muddled all the time. I’m not hanging {b} for that."',
    '{a} hears {b} tell last night slightly differently, and lets it pass.\n{b}: "Then I was in the kitchen, I think."\n{a}: "Mm."\n{a} (to camera): "Everyone gets mixed up in here. I’m not going to jump on it."',
    '{a} spots the detail and decides not to make a thing of it.\n{a} (to camera): {cam:drop-it}',
  ],
  'told-somebody': [
    '{a} doesn’t raise it with {b}. {a} raises it with {c}.\n{a}: "Ask {b} where {bSub} was last night. Then ask again later."\n{c}: "Why?"\n{a}: "Just do it. See if you get the same answer."',
    '{a} finds {c} alone and tells {cObj} about {b}’s changing story.\n{a}: {say:suspect:{b}}\n{c}: "Really? What’s {b} done?"\n{a}: "Nothing, yet. Just keep an ear out."',
    '{a} passes it on to {c}, quietly.\n{a}: "{b} told me two different things about last night."\n{c}: "Maybe {b} just forgot."\n{a}: "Maybe."',
    '{a} tells {c} what {aSub} noticed about {b}, and nobody else.\n{a}: "Keep this between us. {b}’s story doesn’t add up."\n{c}: {say:agree-suspect:{b}}',
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
    '{a} and {b} both see {c} and {d} stop talking the moment anyone comes close.\n{a}: "Did you see that?"\n{b}: "They went quiet as soon as we walked in."\n{a}: "That wasn’t small talk."',
    '{a} and {b} spot {c} and {d} deep in conversation in the corner.\n{b}: "What do you think that was about?"\n{a}: "Nothing good, the way they split up."',
    '{a} nudges {b} and nods at {c} and {d}.\n{a}: "Them two. Again."\n{b}: "I’ve noticed. That’s three times today."',
    '{c} and {d} break off their conversation as {a} and {b} walk past.\n{b}: "Well, that’s not suspicious at all."\n{a}: "We should keep an eye on those two."',
  ],
  'argued-about-it': [
    '{a} thinks {c} and {d} breaking off like that means something. {b} doesn’t.\n{a}: "They stopped talking the second they saw us."\n{b}: "People are allowed to talk, {a}."\n{a}: "Not like that."',
    '{a} and {b} disagree about what they just saw.\n{b}: "They were talking. People talk."\n{a}: "You don’t go quiet when you’re talking about lunch."\n{b}: "Maybe they were talking about us. That’s not a crime."',
    '{a} wants to make something of {c} and {d}. {b} won’t have it.\n{a}: "That was a Traitor chat. I’d bet on it."\n{b}: {say:doubt-suspect:{c}}',
    '{a} and {b} argue about {c} and {d} all the way down the corridor.\n{b}: "You see a plot in everything."\n{a}: "And you see nothing in anything."',
  ],
  'went-and-asked': [
    '{a} and {b} walk straight over to {c} and {d}.\n{a}: "Alright, what are you two whispering about?"\n{c}: "The mission. Why?"\n{a}: "You went very quiet when we came in."\n{d}: "Because you came in."',
    'Instead of sitting on it, {a} goes over and asks, with {b} a step behind.\n{a}: "Private chat?"\n{c}: "Not really. Just talking."\n{b}: "Didn’t look like just talking."',
    '{a} and {b} go and ask {c} what that was about.\n{c}: "Honestly? We were talking about you two."\n{a}: "Oh yeah? What about us?"\n{c}: "How close you are."',
    '{a} doesn’t guess. {a} asks.\n{a}: "{c}, what were you and {d} on about just then?"\n{c}: "Home stuff. Families."\n{b} (to camera): "Maybe. Maybe not. At least we asked."',
  ],
  'told-somebody-else': [
    '{a} and {b} saw {c} and {d} go quiet. By bedtime, someone else knows about it too.\n{a}: "We told one person."\n{b}: "And now it’s round the castle."\n{a}: "Great."',
    '{a} and {b} mention what they saw to one other person, and it spreads.\n{a}: "Who did you tell?"\n{b}: "One person. One!"\n{b} (to camera): "I only said it once. Now everyone’s asking {c} and {d} what they were talking about."',
    '{a} tells the story of {c} and {d} at dinner, and it takes on a life of its own.\n{b}: "You made it sound worse than it was."\n{a}: "I just said what we saw."',
    'What {a} and {b} saw is in somebody else’s hands within the hour.\n{b}: "Did you tell anyone?"\n{a}: "One person. It’s gone round."\n{a} (to camera): "I didn’t mean for it to go round. But it has, and I’m not sorry."',
  ],
  'saw-it-alone': [
    '{a} sees {c} and {d} walk off together, then come back separately.\n{a} (to camera): {cam:holding-info}',
    '{a} notices {c} glance at {d} across the room, and {d} give the smallest nod.\n{a} (to camera): "Tiny thing. Nobody else saw. I did."',
    '{a} catches {c} and {d} whispering by the stairs.\n{a} (to camera): {cam:unsure-info}',
    '{a} walks into the kitchen and {c} and {d} stop talking.\n{a} (to camera): "Silence when you walk in is never nothing."',
    '{a} sees {c} and {d} talking behind the castle, out of sight of everyone else.\n{a} (to camera): {cam:holding-info}',
    '{a} spots {c} and {d} leave the room one after the other.\n{a} (to camera): {cam:unsure-info}',
    '{a} comes round a corner and sees {c} and {d} stop talking.\n{a} (to camera): "Nobody else saw it. Just me. {c} and {d}, heads together, then nothing."',
    '{a} walks past the library and sees {c} and {d} go quiet.\n{a} (to camera): {cam:holding-info}',
    '{a} spots {c} and {d} talking low on the stairs, and they split up when they see {aObj}.\n{a} (to camera): "You don’t split up like that unless you’ve been caught."',
    '{a} is the only one who sees {c} and {d} huddled together by the door.\n{a} (to camera): {cam:unsure-info}',
    '{a} catches the end of something between {c} and {d}. Just the end.\n{a} (to camera): "I heard ‘tonight’ and then nothing. Could be anything. Could be something."',
    '{a} sees {c} hand {d} something small. Then they both walk off different ways.\n{a} (to camera): "I don’t know what that was. I know what it looked like."',
    '{a} sees {c} and {d} come out of the same room, a minute apart.\n{a} (to camera): {cam:holding-info}',
    '{a} sees {c} and {d} stop mid-sentence as {aSub} walks by.\n{a} (to camera): "No witness. Just me. Which means I either say it and look paranoid, or keep it."',
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
    '{a} has been keeping a list about {b}{since}, and it’s getting longer.\n{a} (to camera): "Every day, one more thing about {b}. On their own they’re nothing. Together, I don’t like it."',
    '{a} adds another thing to {aPos} list about {b}{since}.\n{a} (to camera): {cam:notes}',
    '{a} has had {b} in mind{since}, and nothing has changed {aPos} mind.\n{a} (to camera): "I’ve got a list on {b}. I just need one more thing."',
    '{a} keeps a quiet tally on {b}{since}.\n{a} (to camera): "I’m not saying anything yet. But {b} keeps giving me reasons."',
  ],
  'put-it-to-them': [
    '{a} puts the whole list to {b}, in order.\n{a}: "First night, you changed your vote. Second day, you said you were upstairs, then the kitchen. Yesterday, you went quiet every time the murder came up. Explain."\n{b}: {say:deny}\n{a}: "That’s not an explanation."',
    '{a} lays it all out for {b}.\n{a}: "Do you want it from the first day, or just from yesterday?"\n{b}: "From the first day. Go on."\n{a} goes through the lot. {b} answers every point.',
    '{a} sits {b} down and goes through everything.\n{a}: "I’ve been watching you. I want to hear your side."\n{b}: "Go on then. What have I done?"\n{a}: "It’s a list."',
    '{a} confronts {b} with the list.\n{b}: "You’ve been keeping notes on me?"\n{a}: "Someone had to."\n{b}: "That’s mental."',
  ],
  'showed-somebody': [
    '{a} doesn’t take the list to {b}. {a} takes it to {c}.\n{a}: "I’ve been keeping track of {b}. Look at this."\n{c}: "That’s a lot."\n{a}: "Exactly."',
    '{a} shares {aPos} list on {b} with {c}.\n{c}: "When did you start this?"\n{a}: "Day one."\n{c}: "And it’s all {b}?"\n{a}: "It’s all {b}."',
    '{a} tells {c} everything {aSub} has on {b}.\n{a}: {say:suspect:{b}}\n{c}: {say:agree-suspect:{b}}',
    '{a} stops keeping it to {aRef} and tells {c}.\n{c}: "Why are you telling me?"\n{a}: "Because you’re the one person I trust with it."',
  ],
  'let-the-list-go': [
    '{a} reads back {aPos} list on {b} and realises it’s just {b} being a normal person.\n{a} (to camera): "Out loud it sounded like nothing. It was nothing. I’m dropping {b}."',
    '{a} goes through everything {aSub} had on {b}, and none of it holds up.\n{a} (to camera): {cam:drop-it}',
    '{a} decides the list about {b} isn’t going anywhere.\n{a} (to camera): "I was building a case out of nothing. I need to stop."',
    '{a} lets {b} off {aPos} list.\n{a} (to camera): "I think I was wrong about {b}. It happens."',
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
    '{a} brings up something about {b} that {b} thought was long dead.\n{a}: "That thing on the first night. You never explained it."\n{b}: "Seriously? That was days ago."\n{a}: "It’s still not explained."',
    'Out of nowhere, {a} goes back to an old question.\n{a}: "I’ve been thinking about the first mission."\n{b}: "Why now?"\n{a}: "Because it still bothers me."',
    '{a} digs up an old argument with {b}.\n{b}: "I thought we’d moved on from that."\n{a}: "You moved on. I didn’t."',
    '{a} won’t let an old thing go.\n{a}: "Tell me again what you were doing that night."\n{b}: "I’ve told you."\n{a}: "Tell me again."',
  ],
  'answered-at-last': [
    '{b} finally gives {a} a straight answer to the old question.\n{b}: "Fine. I was on the phone to production about my back. That’s it. That’s the big secret."\n{a}: "Why didn’t you just say?"\n{b}: "Because you never asked nicely."',
    'It turns out there was always an explanation.\n{b}: "I was crying in the bathroom. I didn’t want anyone to know."\n{a}: "Oh. God. I’m sorry."',
    '{b} gives {a} the answer at last, and it’s dull.\n{b}: "I was asleep. Honestly. That’s all."\n{a}: "Then why didn’t you just say that?"\n{b}: "I did. You didn’t listen."',
    '{a} gets an answer {aSub} can actually believe.\n{a}: "Okay. I believe you."\n{b}: "Finally."',
  ],
  'nobody-cared': [
    '{a} brings up the old issue with {b}, and nobody else remembers it.\n{b}: "Nobody even remembers that."\n{a}: "I do."\n{b}: "Then it’s just you."',
    '{a} tries to revive an old suspicion and gets blank faces.\n{a} (to camera): "I raised it, and people looked at me like I was mad. Maybe I am."',
    '{a} puts the old thing back on the table. The table has moved on.\n{b}: "That’s old news, mate."\n{a}: "It’s not news. It’s unanswered."',
    '{a} explains why it still matters, and the explaining is what people remember.\n{a} (to camera): "Everyone thinks I’m obsessed. Maybe I am. Something’s there."',
  ],
  'put-it-down': [
    '{a} gets as far as bringing it up, then hears how old it sounds.\n{a}: "About the first night—"\n{b}: "What about it?"\n{a}: "Actually, doesn’t matter."',
    '{a} has the old question ready all evening and never asks it.\n{a} (to camera): {cam:drop-it}',
    '{a} decides the old issue with {b} isn’t worth reopening.\n{a} (to camera): "It’s been too long. If it mattered, it would’ve come up again by now."',
    '{a} starts to say it, stops, and changes the subject.\n{b}: "What were you going to say?"\n{a}: "Nothing. Forget it."',
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
    '{a} and {b} compare notes on {c} over breakfast, quietly.\n{a}: {say:suspect:{c}}\n{b}: {say:agree-suspect:{c}}\n{a}: "Right. So it’s not just me."',
    'Out of earshot of {c}, {a} and {b} go through what they’ve both noticed.\n{b}: "{c} was the last one up the night before the murder."\n{a}: "And the first one down. I noticed that too."',
    '{a} and {b} swap what they’ve got on {c}.\n{a}: "You go first."\n{b}: "{c} changed {cPos} vote at the last second. Twice."\n{a}: "Same thing I saw."',
    '{a} and {b} find they’ve been watching the same person.\n{a}: "Tell me I’m not the only one looking at {c}."\n{b}: "You’re not. I’ve been watching {c} for days."',
  ],
  'named-somebody-else': [
    '{a} says {c}. {b} listens, then says a different name.\n{a}: {say:suspect:{c}}\n{b}: "Not {c}. {c}’s just loud. Loud isn’t guilty."\n{a}: "Then who?"\n{b} leans in and tells {aObj}.',
    '{a} raises {c}. {b} has somebody else in mind.\n{b}: "You’re looking in the wrong place."\n{a}: "Go on then. Who?"\n{b}: "Watch who’s quiet, not who’s loud."',
    '{a} puts {c} forward. {b} doesn’t buy it.\n{b}: {say:doubt-suspect:{c}}\n{a}: "Fine. Who do you think?"',
    '{a} and {b} disagree about {c}, and {b} puts up another name.\n{b}: "I’d look at who’s been agreeing with everyone. That’s my tell."\n{a}: "That’s half the castle."',
  ],
  'would-not-join-in': [
    '{a} starts talking about {c}. {b} shuts it down.\n{b}: "Say it to {c}, or don’t say it."\n{a}: "I’m just talking."\n{b}: "Behind {cPos} back. I’m not doing that."',
    '{a} brings up {c}, and {b} won’t join in.\n{b}: "I’m not gossiping about someone who isn’t here."\n{a}: "It’s not gossip. It’s the game."\n{b}: "Then play it to {cPos} face."',
    '{a} wants to talk about {c}. {b} changes the subject.\n{a}: "Did you hear what I said?"\n{b}: "I did. I’m not getting into it."',
    '{b} won’t say anything about {c} while {c} isn’t there.\n{b}: "Not like this."\n{a}: "I’m only saying what I’ve seen."\n{a} (to camera): "{b} wouldn’t touch it. I don’t know if that’s loyalty or something else."',
  ],
  'took-it-away': [
    '{b} agrees with everything {a} says about {c}, and gives nothing back.\n{a}: {say:suspect:{c}}\n{b}: "Interesting. Very interesting."\n{a} (to camera): "{b} took all of that and didn’t give me a thing. Hmm."',
    '{a} gives {b} a full read on {c}. {b} takes it and says thanks.\n{b}: "Thanks for that. Really useful."\n{a}: "Your turn."\n{b}: "I haven’t got anything. Sorry."',
    '{a} hands {b} everything {aSub} has on {c}.\n{b}: "Keep going."\n{a}: "That’s all of it. What have you got?"\n{b}: "Nothing yet."',
    '{b} listens to all of {a}’s theory about {c}, nodding.\n{a}: "So you agree with me about {c}?"\n{b}: "I agree it’s interesting."\n{b} (to camera): "Useful. I’ll keep it. {a} doesn’t need to know what I think."',
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
    '{a} accuses {b} to {bPos} face, and {b} takes it apart point by point.\n{a}: "I think you’re a Traitor."\n{b}: {say:deny}\n{a}: "Then explain yesterday."\n{b} does, calmly, and {a} runs out of things to say.',
    '{a} pushes {b} hard. {b} doesn’t flinch.\n{a}: "Just tell me the truth."\n{b}: "I am. You’re just not listening."',
    '{a} lays it out. {b} answers every part of it.\n{a}: "You voted one way, then argued the other way the next day."\n{b}: "Because I changed my mind. People do that."',
    '{a} confronts {b}, and {b} stays completely calm.\n{b}: "Say it to the table if you’re so sure. I’ll answer there too."\n{a}: "I will, then."',
  ],
  denyWeak: [
    '{a} accuses {b}, and the denial doesn’t sound right.\n{a}: "It’s you, isn’t it?"\n{b}: "No! No. It’s not — why would you say that?"\n{a}: "That was a lot of no’s."',
    '{b} says the words, but {bPos} voice doesn’t match them.\n{b}: "That’s not true."\n{a}: "Look at me and say it."\n{a} (to camera): "{b} said it wasn’t true. {b} didn’t look at me when {bSub} said it."',
    '{a} watches {b} deny it and gets more sure, not less.\n{b}: {say:deny}\n{a}: "You’re sweating."\n{b}: "It’s warm in here!"',
    '{b}’s answer to {a} goes on too long.\n{b}: "I was in bed, I was — honestly, I was in bed, why would I — ask anyone."\n{a}: "I’m asking you."',
  ],
  turned: [
    '{a} accuses {b}. {b} turns it straight back round.\n{b}: "Why are you so desperate to make it me?"\n{a}: "I’m not desperate."\n{b}: "You’ve asked me three times today. That’s desperate."',
    '{a} starts off accusing, and ends up explaining {aRef}.\n{b}: "Where were you last night, then?"\n{a}: "That’s not — we’re talking about you."\n{b}: "We were. Now we’re talking about you."',
    '{b} doesn’t answer the accusation. {b} asks a better question.\n{b}: "Who put you up to this?"\n{a}: "Nobody."\n{b}: "Someone’s using you. I’d work out who."',
    '{b} flips it on {a} completely.\n{b}: "You know what Traitors do? Accuse people first."\n{a}: "That’s rubbish."\n{b}: "Is it?"',
  ],
  confess: [
    '{b} cracks, but not about what {a} thinks.\n{b}: "Fine! I lied about the mission. I didn’t find the clue, someone else did. I took the credit."\n{a}: "That’s it?"\n{b}: "That’s it. That’s all I’ve done."',
    'Cornered, {b} confesses to something else entirely.\n{b}: "I’m not a Traitor. But I have been voting with the same people on purpose. There. That’s the secret."\n{a}: "You’ve got an alliance?"\n{b}: "Keep it down."',
    '{b} admits something real, and it isn’t what {a} came for.\n{b}: "I told someone I’d vote one way, and I voted the other. I’m not proud of it."\n{a}: "That’s not what I asked."',
    '{b} breaks, and the confession is about the wrong thing.\n{b}: "I’ve been lying about my job. There. Happy?"\n{a}: "Your job? I asked if you were a Traitor."',
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

    const line = pronounSlots(pick(rng, ACCUSE_LINES[branch]).replace(/\{a\}/g, accuser).replace(/\{b\}/g, accused),
      { a: accuser, b: accused });
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
    '{a} and {b} put {c}’s story side by side, and it doesn’t line up.\n{a}: "{c} told me bed by eleven."\n{b}: "{c} told me the kitchen at half eleven."\n{a}: "So which is it?"',
    '{a} and {b} compare what {c} has told each of them.\n{b}: "That’s not what {cSub} said to me."\n{a}: "No. That’s interesting."',
    'Neither {a} nor {b} can make {c}’s evening add up.\n{a}: "There’s an hour missing."\n{b}: "At least."',
    '{a} and {b} go over {c}’s movements hour by hour.\n{b}: "Between ten and eleven, nobody saw {c}."\n{a}: "Nobody at all?"\n{b}: "Nobody."',
  ],
  'checked-out': [
    '{a} and {b} go through {c}’s day hour by hour. Every hour, somebody saw {cObj}.\n{a}: "It all checks out."\n{b}: "Annoyingly."',
    '{c}’s timeline holds up. {a} was hoping it wouldn’t.\n{a}: "I really thought we’d find something."\n{b}: "Maybe {c}’s just innocent."',
    '{a} and {b} check {c}’s story from every angle.\n{b}: "Every minute accounted for."\n{a}: "Fine. {c}’s clear. For now."',
    '{a} and {b} compare notes and find nothing wrong with {c}.\n{a}: "{c} was where {c} said, every hour."\n{b}: "Then it’s not {c}."\n{a} (to camera): "Clean. Either {c}’s Faithful, or very, very good."',
  ],
  'lost-the-hour': [
    '{a} and {b} try to check {c}’s story and can’t agree on their own.\n{a}: "Dinner was at eight."\n{b}: "It was nine."\n{a}: "Then we’re useless."',
    '{a} and {b} give up trying to check {c}.\n{b}: "We can’t even remember our own night."\n{a}: "No. This is hopeless."',
    '{a} and {b} get the times muddled and abandon it.\n{a}: "Forget it. We’ll never pin it down."\n{b}: "It was either half ten or half eleven."\n{a}: "That’s the whole problem."',
    '{a} and {b} argue about what time everything happened, and never get to {c}.\n{b}: "This castle has no clocks."\n{a}: "That’s the problem."',
  ],
  'one-of-us-was-there': [
    '{a} and {b} are checking {c}’s hour when {b} realises {bSub} was there too.\n{b}: "Hang on. I was in that corridor."\n{a}: "You were?"\n{b}: "Yeah. And so was {c}. We walked up together."',
    'It stops being about {c} when {a} works out {b} was in the same place.\n{a}: "So you were with {c}?"\n{b}: "For a bit. Why are you looking at me like that?"',
    '{b} goes quiet halfway through the timeline.\n{b}: "I was there, at that time."\n{a}: "Why didn’t you say?"\n{b}: "I didn’t think about it till now."',
    '{a} and {b} realise their own timeline overlaps with {c}’s.\n{a}: "So either {c} is clear, or you’re not."\n{b}: "Thanks for that."',
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
    '{a} watches {b}’s hands more than {bPos} words.\n{a} (to camera): "{b} was fiddling with {bPos} sleeve the whole time we talked about the murder. That’s nerves."',
    '{b} talks, and {a} watches where {bSub} looks.\n{a} (to camera): "Anywhere but at me. The whole conversation."',
    '{a} reads {b} across the breakfast table.\n{a} (to camera): {cam:watching}',
    '{a} notices {b} laughing a beat too late.\n{a} (to camera): "Small things. But I’m watching the small things."',
  ],
  'asked-what-it-was': [
    '{a} asks {b} about it straight out.\n{a}: "You’ve been doing that with your hands all morning. What’s going on?"\n{b}: "Nothing. I’m cold."\n{a}: "It’s not cold."',
    '{a} doesn’t just watch. {a} asks.\n{a}: "You alright? You seem on edge."\n{b}: "I’m fine. Why does everyone keep asking me that?"',
    '{a} calls it out.\n{a}: "Why can’t you look at me when we talk about last night?"\n{b}: "I can look at you. There. Happy?"',
    '{a} puts it to {b}.\n{a}: "Something’s bothering you."\n{b}: "Everything’s bothering me. Someone died."',
  ],
  'caught-them-looking': [
    '{b} looks up and catches {a} staring.\n{b}: "You’ve been watching me for days. Just say it."\n{a}: "Say what?"\n{b}: "Whatever you think I am."',
    '{a} and {b} lock eyes across the room, and neither looks away.\n{b}: "Something you want to ask me?"\n{a}: "Not yet."',
    '{b} notices {a} watching {bObj}.\n{b}: "Take a picture, it’ll last longer."\n{a}: "Just thinking."\n{b}: "About me, obviously."',
    '{b} catches {a} reading {bObj}.\n{b}: "I know what you’re doing."\n{a}: "What am I doing?"\n{b}: "Deciding."',
  ],
  'was-nothing': [
    '{a} waits all morning for {b} to do it again. {b} doesn’t.\n{a} (to camera): {cam:drop-it}',
    '{a} watches {b} closely, and sees nothing.\n{a} (to camera): "I was sure I saw something yesterday. Today, nothing. Maybe it was me."',
    '{a} decides {b}’s nerves were just nerves.\n{a} (to camera): "Everyone’s jumpy in here. It doesn’t make them a Traitor."',
    '{a} lets go of the suspicion about {b}.\n{a} (to camera): "It was there, and now it’s gone. I’m being honest about that."',
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
    '{a} and {b} work out, in whispers, who is actually working with who.\n{a}: "So there’s a group of four in the middle."\n{b}: "And two floating. And one on their own."\n{a}: "Agreed."',
    '{a} and {b} sketch the castle’s alliances on a napkin.\n{b}: "That’s the power group. That’s the outsiders."\n{a}: "And we’re where?"\n{b}: "Nowhere. Which is why we’re doing this."',
    '{a} and {b} map out who’s close to who.\n{a}: "If there are Traitors, they’re not all in one group."\n{b}: "They’d spread out. Makes sense."',
    '{a} and {b} agree on the shape of the room.\n{a}: "That’s it, then. That’s the castle."\n{b}: "Now we just need to know which bits are lying."',
  ],
  'could-not-place-one': [
    '{a} and {b} can place everyone except one person.\n{b}: "Everyone fits somewhere. Except them."\n{a}: "That’s either a floater, or someone very careful."',
    '{a} and {b} get the whole castle mapped, apart from one name.\n{a}: "I can’t work out who they’re with."\n{b}: "That’s what bothers me."',
    'One name won’t sit anywhere {a} and {b} put it.\n{a} (to camera): "Everyone’s got a group. Except one. And that one’s very friendly with everyone."',
    '{a} and {b} keep moving one name around the map.\n{b}: "Nobody claims them."\n{a}: "Or everybody does."',
  ],
  'put-each-other-on-it': [
    '{a} maps the room for {b}, and puts {b} in a group {b} isn’t in.\n{b}: "You’ve got me with them?"\n{a}: "Aren’t you?"\n{b}: "No. Is that really where you’ve got me?"',
    '{a} shows {b} the alliances {aSub} has worked out.\n{b}: "Why am I in that group?"\n{a}: "You’re always with them."\n{b}: "I’m always with you."',
    '{b} spots {bRef} on {a}’s map, in the wrong place.\n{b}: "Well, that’s insulting."\n{a}: "Tell me where to put you, then."',
    '{a} puts {b} in the group {a} trusts least.\n{b}: "Wow. Okay."\n{a}: "It’s just how it looks from outside."',
  ],
  'redrew-it': [
    '{a} and {b} had a map of the castle a week ago. Tonight they tear it up.\n{a}: "None of this is right any more."\n{b}: "Too many people have gone."\n{a}: "And too many have changed sides."',
    '{a} and {b} start their alliance map again from scratch.\n{b}: "Who’s with who now?"\n{a}: "Honestly? No idea. Let’s start again."',
    'The map {a} and {b} built doesn’t survive the week.\n{a}: "Two of our groups don’t exist any more."\n{b}: "Then we draw new ones."',
    '{a} and {b} redraw the castle, and it looks completely different.\n{a}: "Yesterday those two were in different groups."\n{b}: "Today they’re sitting together."\n{b} (to camera): "It changes every day. That’s what makes it hard."',
  ],
  'drew-it-alone': [
    '{a} notices who always ends up next to who at the table.\n{a} (to camera): "Same people, same seats, every night. That’s not an accident."',
    '{a} works out who never votes against who.\n{a} (to camera): {cam:ballots}',
    '{a} watches the castle split into little groups after dinner.\n{a} (to camera): {cam:watching}',
    '{a} goes over who defended who at the last table.\n{a} (to camera): "People protect their own. Watch who protects who, and you’ve got the groups."',
    '{a} spends an hour trying to work out who’s really close to who.\n{a} (to camera): {cam:notes}',
    '{a} notices two people who never seem to talk, and wonders why.\n{a} (to camera): "Avoiding each other in public. That’s either a feud or a secret."',
    '{a} works out, alone, who is close to who in the castle.\n{a} (to camera): {cam:watching}',
    '{a} sits on the stairs, mapping the alliances in {aPos} head.\n{a} (to camera): "There’s a group of four that always eat together. That’s where I’d hide, if I was a Traitor."',
    '{a} lies on the bed working out the groups.\n{a} (to camera): "Everyone’s in a gang. The trick is working out which gang has a Traitor in it."',
    '{a} writes the castle’s alliances down, then crosses half of them out.\n{a} (to camera): {cam:notes}',
    '{a} watches who sits with who at dinner and draws the map from that.\n{a} (to camera): "Who eats with who tells you everything. Well, nearly everything."',
    '{a} tries to work out the groups on {aPos} own, with nobody to check it against.\n{a} (to camera): "I think I’ve got it. I’ve thought that before."',
    '{a} spends the evening working out who is protecting who.\n{a} (to camera): "People don’t vote for their friends. So who never gets voted for? That’s your group."',
    '{a} goes over the alliances again before bed.\n{a} (to camera): {cam:replay-week}',
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
    '{a} asks {b} a simple question, and gets a very long answer.\n{a}: "Did you sleep alright?"\n{b}: "Yes, I went up at ten, well, quarter past, I was with — why do you ask?"\n{a}: "I just asked if you slept."',
    '{b} explains {bRef} for far longer than the question needs.\n{a}: "It was only a question."\n{b}: "I know, I just want to be clear."',
    '{a} asks something polite and gets a full defence back.\n{a}: "Nice day for it."\n{b}: "I wasn’t anywhere near the tower, if that’s what you mean."\n{a}: "It isn’t."',
    '{b} over-explains to {a}, and it doesn’t help.\n{a}: "I just asked when you went up."\n{b}: "Right, yes, eleven, but before that I was in the kitchen, and before that—"\n{a} (to camera): "I asked one thing. {b} answered five. That tells me something."',
  ],
  'caught-themselves': [
    '{b} hears {bRef} rambling halfway through and stops.\n{b}: "I was — sorry. Anyway. What did you ask?"\n{a}: "Nothing important."',
    '{b} realises {a} only asked one thing.\n{b}: "Sorry, I’m going on. Ignore me."\n{a}: "You’re fine. Go on."\n{a} (to camera): "{b} caught {bRef}. That was almost worse."',
    '{b} stops dead mid-sentence.\n{b}: "I don’t know why I’m telling you all this."\n{a}: "Neither do I."',
    '{b} goes quiet halfway through a long answer.\n{b}: "Anyway. Doesn’t matter."\n{a}: "It seemed to matter a minute ago."',
  ],
  'it-worked': [
    '{b} buries {a} in detail, and somewhere in it {a} decides {b} is just anxious.\n{b}: "…and then I put the kettle on, and then—"\n{a}: "Okay. Okay. I believe you."\n{a} (to camera): "Too much information. But I think {b} is just nervous, not guilty."',
    '{b}’s long answer ends up convincing {a}.\n{a}: "Okay. I believe you."\n{b}: "Thank God."',
    '{a} doesn’t enjoy it, but {b}’s over-explaining works.\n{b}: "…and that’s everything, I think. Every minute."\n{a}: "That was a lot of minutes."\n{a} (to camera): "It was a lot. But it hung together."',
    '{b} talks too much, and {a} ends up trusting {bObj} more.\n{a}: "You’re a terrible liar. So I don’t think you’re lying."\n{b}: "Is that a compliment?"',
  ],
  'nobody-asked-you': [
    '{a} cuts {b} off in the middle of it.\n{a}: "I didn’t ask you that."\n{b}: "I just thought—"\n{a}: "I asked about lunch."',
    '{a} lets {b} finish, then asks the original question again.\n{a}: "So. Who’s washing up?"\n{b}: "...Me. I’ll do it."',
    '{a} points out that nobody accused {b} of anything.\n{a}: "Nobody said you did anything."\n{b}: "I know. I just wanted to say."\n{a} (to camera): "Guilty people explain before they’re asked."',
    '{a} stops {b} mid-defence.\n{a}: "Why are you defending yourself? I didn’t say anything."\n{b}: "Oh. Right. Sorry."',
  ],
  'let-it-go': [
    '{a} decides {b} is scared, not careful.\n{a}: "You alright? You’re talking very fast."\n{b}: "I’m just nervous. Everyone’s so tense."\n{a} (to camera): "{b} over-explains everything. That’s nerves, not guilt."',
    '{b} over-explains and {a} lets {bObj} off.\n{a}: "It’s fine. Honestly. Breathe."\n{b}: "Sorry. I’m just on edge."',
    '{a} lets {b} ramble and doesn’t hold it against {bObj}.\n{b}: "Sorry. I talk when I’m nervous."\n{a}: "We all do in here."\n{a} (to camera): "Everyone explains too much in here. It’s the stress."',
    '{a} gives {b} the benefit of the doubt.\n{a}: "You’re alright, {b}."\n{b}: "Am I? Thanks."',
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
    'A few people start questioning {b} at once. {b} doesn’t budge.\n{a}: "Just tell us where you were."\n{b}: "I’ve told you. Asking louder won’t change it."',
    'The group turns on {b}, and {b} waits them out.\n{b}: "Are you done? Because my answer’s the same."\n{a}: "Then say it again."',
    'Everyone’s asking {b} questions at once. {b} stays calm.\n{b}: "One at a time. I’ll answer all of you."\n{a}: "Fine. Where were you?"',
    '{a} leads the questions, and {b} holds firm.\n{a}: "Something doesn’t add up with you."\n{b}: {say:deny}',
  ],
  cracks: [
    'The group presses {b}, and {b} starts contradicting {bRef}.\n{a}: "You said the library."\n{b}: "I said — no, I said the hall. Didn’t I?"\n{a}: "You said the library."',
    '{b} folds under the pressure fast.\n{b}: "I don’t know! I don’t remember! Stop asking me!"\n{a}: "Nobody’s shouting, {b}."\n{a} (to camera): "That was not how an innocent person answers."',
    'It takes less than a minute for {b} to get tangled up.\n{a}: "Which one is it?"\n{b}: "Both. Neither. I don’t know."',
    '{b} can’t get the story straight with everyone watching.\n{b}: {say:answer-shaky}\n{a}: "That’s not what you said this morning."',
  ],
  redirects: [
    'The group turns on {b}, and {b} points them at somebody else.\n{b}: "Why are you all on me? Ask the quiet ones where they were."\n{a}: "We’re asking you."\n{b}: "And I’m telling you to look somewhere else."',
    '{b} takes the pressure and turns it round.\n{b}: "You know who hasn’t said a word all day? Think about that."\n{a}: "Who?"\n{b}: "You tell me."',
    'By the end, the room has forgotten it was ever asking {b} anything.\n{b}: "Why is nobody asking the person who’s been silent all day?"\n{a}: "…Actually, that’s a good point."\n{a} (to camera): "{b} was brilliant. We walked in about {b} and walked out talking about someone else."',
    '{b} deflects so smoothly that {a} doesn’t notice until later.\n{b}: "Honestly, if I was you I’d look at who’s been pushing this."\n{a}: "Pushing what?"\n{b}: "Me. All day. Ask yourself why."',
  ],
  overcorrected: [
    '{b} explains {bRef} to the group for far too long.\n{b}: "I went up at ten, I cleaned my teeth, I read for a bit, I—"\n{a}: "Nobody asked for all that."',
    'The group asks {b} one thing, and {b} answers everything.\n{a}: "We only asked where you were."\n{b}: "I know, I’m just giving you everything."\n{a} (to camera): "Way too much detail. That’s what liars do."',
    '{b} over-defends and makes it worse.\n{b}: "And another thing—"\n{a}: "Stop. Just stop talking."',
    '{b} gives a speech nobody asked for.\n{a}: "That was a lot."\n{b}: "I just want you all to know."',
  ],
  'walked-away': [
    '{b} stands up in the middle of it and leaves.\n{b}: "I’m not doing this tonight."\n{a}: "We’re not finished!"\n{a} (to camera): "Walking out. Guilty or fed up? I honestly can’t tell."',
    '{b} gets up and goes.\n{b}: "Talk about me when I’m not here, then. You will anyway."\n{a}: "We just want answers."',
    '{b} leaves the room while the group is still asking questions.\n{a}: "Well. That settles that."\n{b}: "It settles nothing. I’m tired."',
    '{b} walks out, and the room has to decide what that means.\n{a}: "Is that an answer?"\n{b}: "It’s me going to bed."',
  ],
  'admitted-something-else': [
    'Under all the pressure, {b} admits to something, and it isn’t what anybody wanted.\n{b}: "Fine! I’ve been voting with the same people on purpose. We made a deal. That’s all!"\n{a}: "A deal?"\n{b}: "Not a Traitor deal. A normal one."',
    '{b} cracks on a different thing entirely.\n{b}: "I lied about the mission. I didn’t find anything. I said I did."\n{a}: "That’s not what we asked."',
    '{b} gives up something real, and the room doesn’t know what to do with it.\n{b}: "I’ve been scared the whole time. That’s why I’m quiet. That’s all it is."\n{a}: "Scared of what?"\n{b}: "Of this. Of you lot."',
    '{b} admits to something small to get the group off {bPos} back.\n{b}: "Fine. I went downstairs to eat biscuits. At midnight. Happy?"\n{a}: "…Biscuits."\n{a} (to camera): "{b} gave us a little secret so we’d stop looking for a big one."',
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

    const line = pronounSlots(pick(rng, GROUP_PRESSURE_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b), { a, b });
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
    '{a} notices one of {b}’s habits and decides it means something.\n{a} (to camera): "{b} touches {bPos} face every time the murders come up. Every time."',
    '{a} reads a harmless thing {b} does as a tell.\n{a} (to camera): {cam:watching}',
    '{a} watches {b} fiddle with a sleeve and decides it’s guilt.\n{a} (to camera): "Innocent people don’t fidget like that."',
    '{a} decides {b} is nervous for a reason.\n{a} (to camera): "{b} looks terrified. I want to know why."',
  ],
  'told-somebody': [
    '{a} takes {aPos} theory about {b} to {c}.\n{a}: "Watch {b}’s hands when the murders come up."\n{c}: "Why?"\n{a}: "Just watch."',
    '{a} tells {c} what {aSub} has noticed about {b}.\n{a}: {say:suspect:{b}}\n{c}: "Because of a sleeve?"\n{a}: "It’s not just the sleeve."',
    '{a} shares {aPos} read on {b} with {c}.\n{c}: "I don’t see it."\n{a}: "You will."',
    '{a} gets {c} watching {b} all morning.\n{c} (to camera): "I watched {b} all morning. I saw someone eating toast."',
  ],
  'asked-them': [
    '{a} asks {b} about it directly.\n{a}: "Why do you do that with your sleeve?"\n{b}: "What sleeve?"\n{a}: "When we talk about the murders."\n{b}: "I genuinely have no idea what you mean."',
    '{a} puts it to {b}.\n{a}: "You always touch your face when someone mentions the Traitors."\n{b}: "Do I? I’ve got a spot. That’s all."',
    '{a} asks {b} what {aSub} thinks it means.\n{b}: "It means I’m cold, {a}. That’s all it means."\n{a}: "Every time the murders come up."\n{b}: "Because it’s freezing in that room!"',
    '{a} asks, and {b} has no idea what {aSub} is talking about.\n{b}: "You’ve been watching my hands? That’s weird."\n{a}: "Just when the murders come up."\n{b}: "I scratch my nose. That’s it."',
  ],
  'heard-it-out-loud': [
    '{a} says the whole theory about {b} out loud, alone, and it falls apart.\n{a} (to camera): "I said it out loud and it was a sleeve. It was literally just a sleeve."',
    '{a} explains {aPos} read on {b} to the camera and hears how thin it is.\n{a} (to camera): {cam:drop-it}',
    '{a} realises {aPos} theory about {b} is nothing.\n{a} (to camera): "I was building a case out of someone scratching their nose. I need to calm down."',
    '{a} goes through it on {aPos} own and lets it go.\n{a} (to camera): "Nope. That’s nothing. Moving on."',
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
    '{a} is awake when {b} walks past the door, and times how long until {bSub} comes back.\n{a} (to camera): "Twenty minutes. {b} was gone twenty minutes. The bathroom’s next door."',
    '{a} hears footsteps in the corridor after lights out, and knows whose they are.\n{a} (to camera): "I know {b}’s walk. That was {b}."',
    '{a} lies still and listens to {b} go down the corridor.\n{a} (to camera): {cam:heard-doors}',
    '{a} hears {b}’s door open at about two in the morning.\n{a} (to camera): "Where are you going at two in the morning, {b}?"',
  ],
  imagined: [
    '{a} spends half the night sure someone walked past the door.\n{a} (to camera): "I heard something. Or I dreamt it. I genuinely don’t know."',
    '{a} builds a whole theory on a noise in the corridor.\n{a} (to camera): "By four in the morning I’d decided it was {b}. By breakfast I wasn’t sure there’d been a noise."',
    '{a} hears the floor creak and can’t sleep after that.\n{a} (to camera): {cam:cant-sleep}',
    '{a} is sure {aSub} heard {b} in the corridor, then isn’t.\n{a} (to camera): "Could’ve been the pipes. This place makes noises."',
  ],
  caught: [
    '{b} comes back past the door and finds {a} sitting up, wide awake.\n{a}: "Late night?"\n{b}: "Bathroom."\n{a}: "For twenty minutes?"\n{b}: "Goodnight, {a}."',
    '{a} doesn’t bother hiding that {aSub} was listening.\n{b}: "Were you waiting up for me?"\n{a}: "Just couldn’t sleep."\n{b}: "Right."',
    '{b} walks straight into {a} on the landing.\n{b}: "Oh! You scared me."\n{a}: "What are you doing up?"\n{b}: "Water. What are you doing up?"',
    '{a} catches {b} coming back to bed.\n{a}: "Where’ve you been?"\n{b}: "Nowhere. Go to sleep."',
  ],
  'checked-the-door': [
    '{a} hears a floorboard creak on the landing and holds {aPos} breath.\n{a} (to camera): {cam:heard-doors}',
    '{a} wakes at four and can’t get back to sleep.\n{a} (to camera): {cam:cant-sleep}',
    '{a} lies listening to the castle settle.\n{a} (to camera): "Every noise is someone. Every noise is no one."',
    '{a} gets up and checks the landing, just in case.\n{a} (to camera): {cam:heard-doors}',
    '{a} gets up in the night to look down the corridor. It’s empty.\n{a} (to camera): {cam:heard-doors}',
    '{a} hears something, or doesn’t, and lies awake deciding which.\n{a} (to camera): {cam:cant-sleep}',
    '{a} opens the door a crack at three in the morning. Nothing.\n{a} (to camera): "Empty corridor. Doesn’t mean it was empty an hour ago."',
    '{a} checks the corridor twice before sleeping.\n{a} (to camera): "Paranoid? Maybe. Alive? Yes."',
    '{a} gets up for water and listens at every door on the way.\n{a} (to camera): "Quiet. Too quiet, if you ask me."',
    '{a} lies awake, listening for the turret door.\n{a} (to camera): {cam:heard-doors}',
    '{a} hears a creak and sits up. Nothing else.\n{a} (to camera): "Probably the building. Probably."',
    '{a} checks the corridor, sees nothing, and goes back to bed.\n{a} (to camera): {cam:cant-sleep}',
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

    const line = pronounSlots(pick(rng, DOOR_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b), { a, b });
    const bondDelta = branch === 'caught' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta,
      state: ctx.state?.[a] || 'content' };
  },
});
