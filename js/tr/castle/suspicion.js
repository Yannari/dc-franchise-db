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
import { addBond, getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, heatAt, continueThread,
  advanceCiting, actPhrase, lastClosedThread, outcomeSense } from '../threads.js';
import { suspicion } from '../deduction.js';

const FAMILY = 'suspicion';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

const NOTICE_LINES = [
  '{a} noticed {b}\'s story about last night had a detail that didn\'t match this morning.',
  'Something small in how {b} answered a question made {a} quietly file it away.',
  '{a} couldn\'t say exactly what it was, but {b}\'s timeline felt off by a beat.',
];

registerEvent({
  id: 'susp-noticed-inconsistency',
  family: FAMILY,
  window: 'after-table',
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
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    addBond(a, b, -1);
    let note = pick(rng, NOTICE_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'noticed', pair: [a, b], threadId: t?.id, bondDelta: -1,
      priorOutcome: prior?.outcome ?? null };
  },
});

const OVERHEARD_LINES = [
  '{a} and {b} both clocked {c} and {d} deep in a conversation that stopped the second anyone got close.',
  'Nobody heard a word of it, but {a} and {b} agreed: {c} and {d} were talking about SOMETHING.',
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
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const i = Math.floor(rng() * others.length);
    let j = Math.floor(rng() * others.length);
    while (j === i && others.length > 1) j = Math.floor(rng() * others.length);
    const c = others[i], d = others[j] ?? others[i];
    addBond(a, b, 1); // bonded over shared unease, not over the pair they watched
    const note = pick(rng, OVERHEARD_LINES)
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, c).replace(/\{d\}/g, d);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'overheard', observers: [a, b], observed: [c, d], threadId: t?.id, bondDelta: 1 };
  },
});

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
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    addBond(a, b, -0.5);
    // SPEC 5.2, THE THREAD'S OWN ACT. A tally that started in a different part
    // of the season is a different sentence from one started this morning.
    const since = t.act && t.act !== ctx.act ? `, started back in ${actPhrase(t.act)},` : '';
    const { thread, cited } = advanceCiting(t, ctx.ep, `${a} kept a running mental tally on ${b}${since} and it was not shrinking.`);
    return { branch: 'tracked', pair: [a, b], threadId: thread?.id, cited, bondDelta: -0.5,
      acrossActs: !!since };
  },
});

// A dormant thread that gets picked back up out of nowhere — "she never let
// it go" — is a real story beat threads.js was explicitly built to support
// (findOpenThread reaches a cold-but-open thread; heatAt lets us tell cold
// from dead). Gated `rare` so the RARE_MULTIPLIER amplification actually has
// something to amplify once the precondition (an old, cooled thread) exists.
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
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    const since = t.act && t.act !== ctx.act
      ? ` It had been sitting open since ${actPhrase(t.act)}.` : '';
    const { thread, cited } = advanceCiting(t, ctx.ep,
      `${a} brought it up again, completely unprompted — ${b} thought that one was dead.${since}`);
    addBond(a, b, -1);
    return { branch: 'revived', pair: [a, b], threadId: thread?.id, cited, bondDelta: -1,
      acrossActs: !!since };
  },
});

const WHISPER_LINES = [
  '{a} and {b} spent breakfast quietly comparing notes on {c}, who had no idea.',
  'Out of earshot of {c}, {a} told {b} exactly what they thought was going on there.',
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
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    addBond(a, b, 1);
    let note = pick(rng, WHISPER_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    // SPEC 5.5. Comparing notes on somebody IS remembering how the last story
    // about them ended. No day number here either - see the note in
    // susp-noticed-inconsistency.
    const prior = lastClosedThread(target, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    if (sense === 'walked') note += ` The last time somebody put ${target} on the spot, ${target} had walked away from it, and that was most of what there was to say.`;
    else if (sense === 'cracked') note += ` They kept coming back to the thing that had already come out of ${target} once.`;
    else if (sense === 'coupled') note += ` Half of it was really about who ${target} had been spending their evenings with.`;
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'whispered', pair: [a, b], about: target, threadId: thread?.id, cited, bondDelta: 1,
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
  ],
  denyWeak: [
    '{b} said the words "that\'s not true" but their voice did something else entirely.',
    '{a} watched {b} deny it, and the denial made {a} more sure, not less.',
  ],
  turned: [
    '{b} didn\'t answer the accusation — they asked {a} why they were so desperate to make it.',
    'By the end of it, somehow {a} was the one explaining themselves.',
  ],
  confess: [
    '{b} broke, but not about what {a} thought — they admitted to something else entirely.',
    'Cornered, {b} confessed to a different secret altogether, and it landed almost as hard.',
  ],
};

registerEvent({
  id: 'susp-private-accusation',
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
      if (existing) closeThread(existing.id, ctx.ep, 'denied-convincingly');
      else threadId = openThread(FAMILY, [accuser, accused], ctx.ep, line)?.id;
    } else if (branch === 'denyWeak') {
      bondDelta = -1;
      addBond(accuser, accused, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [accuser, accused], ctx.ep, line);
      threadId = t?.id ?? threadId;
    } else if (branch === 'turned') {
      bondDelta = -2;
      addBond(accuser, accused, bondDelta);
      // Same party-set, but the note is what carries the reversal — the next
      // reader (a future accusation event, in a later task) has to read the
      // note text to know whose move it is, exactly as trust's "turned"
      // branch does.
      const t = openThread(FAMILY, [accuser, accused], ctx.ep, line);
      threadId = t?.id ?? threadId;
    } else {
      bondDelta = 1;
      addBond(accuser, accused, bondDelta);
      if (existing) closeThread(existing.id, ctx.ep, 'confessed-unrelated');
      else threadId = openThread(FAMILY, [accuser, accused], ctx.ep, line)?.id;
    }
    return { branch, pair: [accuser, accused], threadId, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

const TIMELINE_LINES = [
  '{a} and {b} laid out {c}\'s account side by side, and it didn\'t line up cleanly.',
  'Neither {a} nor {b} could quite make {c}\'s morning add up the way {c} told it.',
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
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    addBond(a, b, 0.5);
    const note = pick(rng, TIMELINE_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'crosschecked', pair: [a, b], about: target, threadId: t?.id, bondDelta: 0.5 };
  },
});

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
    const [a, b] = ctx.actors;
    addBond(a, b, -0.5);
    // SPEC 5.5. What `a` is watching FOR depends on how the last story about
    // `b` ended: a person who came apart once is watched for the next crack.
    const prior = lastClosedThread(b, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    const because = sense === 'cracked'
      ? ` ${a} had seen ${b} come apart once already and was waiting for it to happen twice.`
      : sense === 'walked'
        ? ` Whatever ${b} did the last time somebody asked had worked, and ${a} wanted to know how.`
        : '';
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      `${a} watched ${b}'s hands more than ${b}'s words, and didn't love what they saw.${because}`);
    return { branch: 'body-read', pair: [a, b], threadId: thread?.id, cited, bondDelta: -0.5,
      priorOutcome: prior?.outcome ?? null };
  },
});

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
    const [a, b] = ctx.actors;
    addBond(a, b, 0.5);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = `${a} and ${b} sketched out, in whispers, who they thought was actually working together.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'shape-guessed', pair: [a, b], threadId: t?.id, bondDelta: 0.5 };
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
    const [a, b] = ctx.actors;
    addBond(a, b, -1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${b} explained themselves to ${a} for far longer than the question actually required, and it did not help.`);
    return { branch: 'overcorrected', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

const GROUP_PRESSURE_LINES = {
  holds: [
    '{b} took the whole room leaning on them and didn\'t budge an inch.',
    'Six people staring at {b} at once, and {b} just waited them out.',
  ],
  cracks: [
    '{b} folded under the group pressure fast, and it showed.',
    'It took less than a minute for {b} to start contradicting themselves.',
  ],
  redirects: [
    '{b} took the group\'s pressure and pointed it at somebody else entirely.',
    'By the end, the room had forgotten it was ever asking {b} anything.',
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
    addBond(a, b, bondDelta);
    const existing = findOpenThread(FAMILY, ctx.actors);
    const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, ctx.actors, ctx.ep, line);
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'susp-misread-tell',
  family: FAMILY,
  window: 'morning',
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
    const [a, b] = ctx.actors;
    addBond(a, b, -0.5);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} clocked a completely harmless habit of ${b}'s and decided it meant something.`);
    return { branch: 'misread', pair: [a, b], threadId: t?.id, bondDelta: -0.5 };
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
  ],
  imagined: [
    '{a} spent half the night sure somebody had walked past, and half of it sure they had made it up.',
    'There was a sound in the corridor and {a} built four hours of theory on it before dawn.',
    '{a} heard something, decided it was {b}, and had no reason at all for deciding that.',
  ],
  caught: [
    '{b} came back past the door and found {a} sitting up, wide awake, waiting to see who it would be.',
    '{a} did not bother hiding that they had been listening, and {b} did not bother explaining.',
    'They looked straight at each other in the corridor at three in the morning and neither said a word about it.',
  ],
};

registerEvent({
  id: 'susp-heard-in-the-corridor',
  family: FAMILY,
  window: 'night',
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    // SPEC 5.3. Somebody the room came for today does not sleep, and does not
    // stop listening. ctx.state is a frozen, read-only view of the last table.
    return isNervy(ctx.state?.[a]) ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
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
    addBond(a, b, bondDelta);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta,
      state: ctx.state?.[a] || 'content' };
  },
});
