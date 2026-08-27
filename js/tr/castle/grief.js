// ══════════════════════════════════════════════════════════════════════
// tr/castle/grief.js — the empty chair, the counting, who sits where now
// ══════════════════════════════════════════════════════════════════════
//
// This is the family that makes a castle read as unlike a camp. Nobody is
// voted out overnight here — somebody is TAKEN, off-screen, with no
// explanation, and the room finds out at breakfast. A camp's exit is a
// tribal council everybody watched happen; a castle's is an absence. Every
// event in this file is downstream of that one fact, and every one of them
// requires it: `_murderedLastNight` is the shared gate.
//
// No belief writes here either. A murder reaction is about how the SURVIVORS
// process a death, not a claim about who caused it — that channel (if one
// exists at all) belongs to suspicion.js or deduction.js, not here.
import { gs, players } from '../../core.js';
import { pStats } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { _sentenceCase } from './cover.js';
import { openThread, advanceThread, findOpenThread, continueThread } from '../threads.js';
import { alignmentAt } from '../roles.js';
import { lineFor } from './lines.js';

const FAMILY = 'grief';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/** Was there a murder in the round that just closed? Shared by every event below. */
function _victimLastNight(ep) {
  const rounds = gs?.tr?.rounds;
  if (!rounds) return null;
  const round = rounds.find(r => r.ep === ep - 1 && r.murdered);
  return round ? round.murdered : null;
}

const EMPTY_CHAIR_LINES = [
  '{a} and {b} both ended up staring at the same empty seat at breakfast.',
  'Nobody moved {v}\'s chair. {a} and {b} noticed at the same time that nobody had.',
  '{a} caught {b} looking at the gap at the table before either of them said anything.',
  'Somebody had laid the table for the number they had yesterday. {a} and {b} both counted the places.',
  '{b} pulled out {v}\'s chair without thinking, realised, and put it back. {a} pretended not to have seen.',
  'There was too much room at the table now. {a} said so, badly, and {b} knew what they meant.',
];

registerEvent({
  id: 'grief-empty-chair',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 3 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const note = pick(rng, EMPTY_CHAIR_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{v\}/g, v);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'empty-chair', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 1 };
  },
});

// Two SHAPES here, pair and solo, and each had exactly one sentence in it.
// `{n}` is how many are left, which is the only thing the beat is about.
const HEADCOUNT_LINES = {
  pair: [
    '{a} said it out loud so {b} didn\'t have to: {n} of them left.',
    '{a} got to {n} and stopped. {b} had got there first and had not wanted to be the one to say it.',
    '"{n}," said {a}, to nobody in particular, and {b} did not correct them.',
    '{b} watched {a} count the room on their fingers and get to {n} both times.',
    '{a} and {b} arrived at {n} separately and then had to sit with it together.',
    '{b} said the number first. {a} had been hoping to get through breakfast without hearing it.',
    'Neither {a} nor {b} needed to count. Both of them did, and both of them got {n}.',
    '{a} started to say how many were left, stopped, and {b} finished it: {n}.',
  ],
  solo: [
    '{a} counted the castle twice, like the number might change.',
    '{a} counted the room, got {n}, and counted it again to be sure of something.',
    'There were {n} of them. {a} had known that before counting and counted anyway.',
    '{a} did the arithmetic without meaning to, the way you check a pocket for keys.',
    '{a} counted heads at breakfast and could not stop doing it for the rest of the morning.',
    '{a} had known it was {n} before counting, and had counted three times since getting up anyway.',
    '{a} counted the chairs instead of the people, which came to the same thing.',
    'Somewhere between the stairs and the table {a} had done the sum again without deciding to.',
  ],
};

registerEvent({
  id: 'grief-headcount',
  family: FAMILY,
  window: 'morning',
  // ACT: CLOSING (spec 5.4.3, 'late: paranoid, surgical, thread-closing,
  // counting arguments'). Counting the castle twice like the number might
  // change is a different scene at six people than at eighteen.
  acts: { early: 0.5, late: 1.7 },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const actors = ctx.actors;
    const remaining = (ctx.living || []).length;
    const v = _victimLastNight(ctx.ep);
    const shape = actors.length === 2 ? 'pair' : 'solo';
    const note = lineFor(HEADCOUNT_LINES[shape], `grief-headcount|${ctx.ep}|${remaining}`,
      { a: actors[0], b: actors[1] || 'somebody', n: String(remaining) });
    const t = openThread(FAMILY, actors, ctx.ep, note);
    if (actors.length === 2) addBond(actors[0], actors[1], 1);
    // THE BRANCH CARRIES THE SHAPE. One person counting alone and two people
    // arriving at the same number are different scenes, and the (id, branch)
    // table read 56 firings per 400 seasons as one.
    return { branch: `headcount-${shape}`, actors, victim: v, remaining, threadId: t?.id };
  },
});

const RESEATED_LINES = [
  '{a} sat somewhere new this morning, and {b} sat down right next to them without being asked.',
  'Nobody sits where they sat on the first day any more. {a} moved again, and {b} moved with them.',
  '{a} took the chair furthest from the door and {b} took the one beside it, and neither explained.',
  'The table had reorganised itself overnight. {a} ended up next to {b}, and both of them were fine with that.',
  '{a} moved a seat along to close the gap, and {b} moved along after them.',
];

registerEvent({
  id: 'grief-seating-shift',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `grief|morning` held five events and
  // no advancer, the largest dead cell in the pool. Grief is cumulative by
  // nature — the second empty chair is only heavy because of the first — so
  // the citation is doing the work the family already implied.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      lineFor(RESEATED_LINES, `grief-seating-shift|${ctx.ep}`, { a, b }));
    return { branch: 'reseated', pair: [a, b], threadId: thread?.id, cited, bondDelta: 1 };
  },
});

const SHARED_MOURNING_LINES = [
  '{a} and {b} didn\'t talk much this morning. They didn\'t need to.',
  '{a} sat down next to {b} and stayed there, and that was the entire conversation.',
  'Whatever {a} and {b} had before this morning, it was heavier by lunchtime and neither of them mentioned it.',
  '{b} made two cups of tea without asking, and {a} took one, and that was enough.',
  'They did the washing up together, {a} and {b}, very slowly, for much longer than it took.',
];

registerEvent({
  id: 'grief-shared-mourning-bond',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (!_victimLastNight(ctx.ep)) return 0;
    return getBond(a, b) >= 3 ? 2.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(SHARED_MOURNING_LINES, `grief-shared-mourning-bond|${ctx.ep}`, { a, b });
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'shared-mourning', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

const TIMING_LINES = [
  '{a} said to {b}, quietly: "of everyone, why {v}, and why last night?" Neither of them had an answer.',
  '"Why {v}," {a} kept saying to {b}, "and why now." It was not really a question by the fourth time.',
  '{b} pointed out to {a} that {v} had been about to say something at that table. Neither of them liked where that went.',
  '{a} wanted to know what {v} knew. {b} wanted to know who else had wondered that before last night.',
  'Of everybody in the castle, {v}. {a} could not make it fit, and {b} had been trying for an hour longer.',
  '{a} asked {b} what {v} had done to deserve going first, and got a silence that was itself an answer.',
];

registerEvent({
  id: 'grief-suspicion-of-timing',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `grief|morning`. "Why last night" is a question
  // that gets sharper every time it is asked, and the citation is what makes
  // the second asking sound different from the first.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      lineFor(TIMING_LINES, `grief-suspicion-of-timing|${ctx.ep}`, { a, b, v }));
    return { branch: 'timing', pair: [a, b], victim: v, threadId: thread?.id, cited, bondDelta: 1 };
  },
});

// ── FLAGSHIP: the morning reaction — a four-way fork on archetype AND role,
// not a random pick with four labels ────────────────────────────────────
//
// A hero mourns differently than a mastermind, and — this is the part that
// matters — a Traitor sitting at that same breakfast table is processing a
// death they may have CAUSED, which no archetype check alone can capture.
// Role decides what is available (a Traitor can choose to exploit the grief;
// a Faithful cannot, because there is nothing behind their reaction to
// exploit); archetype decides what a person given that choice is like at it.
//   MOURNING OPENLY        — loyal/social archetypes, or just a strong bond
//                            with whoever else is present. Warms the pair.
//   SUSPICIOUS IMMEDIATELY — perceptive/strategic types start asking "who
//                            benefits" out loud. Opens a thread aimed at that
//                            question rather than at grief itself.
//   STOIC WITHDRAWAL       — low-social players go quiet. No bond movement;
//                            the ABSENCE of a reaction is itself the state
//                            change worth recording.
//   OPPORTUNISTIC USE      — ONLY reachable by a living Traitor (role gate,
//                            checked first) — regardless of archetype. A
//                            hero who took the recruitment IS a Traitor now
//                            and this branch is open to them exactly as it is
//                            to a villain; what differs is how well they sell
//                            it, scored the same way cover.js scores a lie.
/** See cover.js: lines that need no partner when there is none to name. */
function _partnerSafe(pool, partner) {
  if (partner) return pool;
  const safe = pool.filter(l => !l.includes('{b}'));
  return safe.length ? safe : pool;
}

const REACTION_LINES = {
  mourn: [
    '{a} didn\'t hide how hard it hit them. {b} sat with them and let it be quiet for a while.',
    '{a} said {v}\'s name out loud like it needed saying, and {b} agreed.',
    '{a} cried at the table, in front of everyone, and did not apologise for it. {b} thought better of them for it.',
    '{a} kept starting sentences about {v} and not finishing them, and {b} let every one of them go unfinished.',
  ],
  suspicious: [
    '{a} skipped past the grief entirely and went straight to "who benefits from this?" {b} didn\'t have a good answer.',
    '{a} was already building a theory before breakfast was over, and said as much to {b}.',
    'Before anybody had said {v}\'s name twice, {a} was asking {b} who had been out of their room.',
    '{a} wanted the timeline, not the eulogy, and made {b} walk through the whole evening with them.',
  ],
  stoic: [
    '{a} said almost nothing all morning. {b} noticed, and let them have it.',
    '{a} went quiet in a way that read as more, not less.',
    '{a} ate breakfast, cleared the plate, and answered every question with one word.',
    'Whatever {a} was doing with it, they were doing it somewhere nobody could watch.',
    '{a} was up before anybody, dressed, useful, and completely unreachable.',
  ],
  opportunistic: [
    '{a} used the room\'s grief to steer {b} toward exactly where {a} wanted the suspicion to land — smoothly enough that {b} never felt managed.',
    '{a} tried to use the moment to move {b} where they wanted, and it came out clumsy enough that {b} half-noticed something was off.',
    '{a} grieved convincingly for {v} and, in the same breath, put a name in {b}\'s head that had not been there at breakfast.',
    '{a} was a fraction too keen to comfort {b}, and a fraction too keen to tell them who to look at, and {b} clocked the second part.',
  ],
};

registerEvent({
  id: 'grief-morning-reaction',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 3 : 0;
  },
  fire(ctx, rng) {
    const reactor = ctx.actors[0];
    const partner = ctx.actors[1] || null;
    const victim = _victimLastNight(ctx.ep);
    const st = pStats(reactor);
    const archetype = players.find(p => p.name === reactor)?.archetype || 'floater';
    const isTraitor = alignmentAt(reactor, ctx.ep) === 'traitor';

    const mournScore = (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.5
      + (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer'].includes(archetype) ? 0.3 : 0);
    const suspiciousScore = (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.5
      + (['perceptive-player', 'mastermind', 'schemer'].includes(archetype) ? 0.3 : 0);
    const stoicScore = (1 - st.social / 10) * 0.6 + 0.15;
    // Permission gate FIRST, competence second — role overrides archetype.
    // A living Traitor can always attempt this branch; the score below only
    // decides how likely they are to REACH for it, not whether they may.
    const opportunisticScore = isTraitor
      ? (st.strategic / 10) * 0.5 + (st.boldness / 10) * 0.5 + 0.2
      : 0;

    const total = mournScore + suspiciousScore + stoicScore + opportunisticScore;
    const roll = rng() * total;
    let branch;
    if (roll < mournScore) branch = 'mourn';
    else if (roll < mournScore + suspiciousScore) branch = 'suspicious';
    else if (roll < mournScore + suspiciousScore + stoicScore) branch = 'stoic';
    else branch = 'opportunistic';

    // See the note on _partnerSafe in cover.js — the old strip left sentences
    // ending on their own verb whenever `{b}` sat mid-clause, and every one of
    // those was quotable by a later citation.
    let line = _sentenceCase(pick(rng, _partnerSafe(REACTION_LINES[branch], partner))
      .replace(/\{a\}/g, reactor).replace(/\{v\}/g, victim)
      .replace(/\{b\}/g, partner || 'somebody'));

    // Every branch has to leave SOMETHING — a solo scene (no partner drawn)
    // still writes residue on the reactor even when it can't move a bond,
    // which is what stops "stoic" (and a solo "mourn"/"opportunistic")
    // from being a no-op event that only reads as content.
    const parties = partner ? [reactor, partner] : [reactor];
    let bondDelta = 0;
    if (branch === 'mourn' && partner) {
      bondDelta = 2;
    } else if (branch === 'opportunistic' && partner) {
      // The "visibly bad at it" case (a nice archetype dragged into the
      // Traitor role) still gets the branch — the role gate already granted
      // it — but the archetype-driven competence gap is reflected in the
      // line pool above (the second line is the clumsy version) and in a
      // smaller net bond gain than a competent user of this same branch
      // would get, which is the mechanical trace of "visibly bad at it."
      const niceButTraitor = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']
        .includes(archetype);
      bondDelta = niceButTraitor ? 0 : 1;
    }
    // 'suspicious' and 'stoic' write no bond delta on purpose — a theory
    // being floated, or a withdrawal, is not itself a change in how two
    // people feel about each other. Both still open the thread below.
    if (bondDelta) addBond(reactor, partner, bondDelta);
    const threadId = openThread(FAMILY, parties, ctx.ep, line)?.id;

    return { branch, reactor, partner, victim, isTraitor, archetype, threadId, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

const KEEPSAKE_LINES = [
  '{a} quietly kept something small of {v}\'s — nobody asked, and {a} didn\'t offer an explanation.',
  'Something of {v}\'s went missing from the room. {a} knew exactly where it was.',
  '{a} took one thing off {v}\'s side of the room before anybody else went in, and never said what.',
  'It was not worth anything. {a} put it in a pocket anyway and kept checking it was still there.',
  '{a} folded {v}\'s jumper properly before leaving it, which nobody had asked anybody to do.',
];

registerEvent({
  id: 'grief-keepsake',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const actor = ctx.actors[0];
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [actor], ctx.ep,
      lineFor(KEEPSAKE_LINES, `grief-keepsake|${ctx.ep}`, { a: actor, v }));
    return { branch: 'keepsake', actor, victim: v, threadId: t?.id };
  },
});

const BLAME_ROOM_LINES = [
  '{a} said out loud that somebody in this castle let {v} die. {b} didn\'t disagree.',
  '"One of us sat at that table last night and knew," {a} said, to the room, and {b} watched who looked up.',
  '{a} was not grieving so much as furious, and {b} caught the edge of it.',
  '{b} said it was nobody\'s fault. {a} said that was exactly the problem, and the room heard both.',
  '{a} pointed out that {v} had been sitting between two people last night, and neither of them was going to say who.',
];

registerEvent({
  id: 'grief-blame-the-room',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, -0.5);
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(BLAME_ROOM_LINES, `grief-blame-the-room|${ctx.ep}`, { a, b, v }));
    return { branch: 'blamed-room', pair: [a, b], victim: v, threadId: t?.id, bondDelta: -0.5 };
  },
});

const TOAST_LINES = [
  '{a} and {b} raised a glass, quietly, to everyone the castle had already lost.',
  '{a} poured two, handed one to {b}, and neither of them said what it was for.',
  'They went through the names, {a} and {b}, in order, and drank once at the end of the list.',
  '{a} lifted a glass to the empty end of the table and {b} lifted one back.',
  '{b} started to make a toast, could not finish it, and {a} finished it for them.',
  '{a} and {b} drank to the ones who went first, which by now was most of the people they came in with.',
  'It was not a ceremony. {a} said a name, {b} said a name, and they both drank.',
  '{a} left a glass on the table for nobody, and {b} did not move it.',
];

registerEvent({
  id: 'grief-toast-to-them',
  family: FAMILY,
  window: 'evening',
  rare: true,
  // ADVANCES AND CITES (Plan 5 Task 2). The only event in `grief|evening`,
  // and a toast that names the day the castle lost somebody is exactly what a
  // toast is for.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    // Reachable, uncommon state: the castle has lost more than one person —
    // by the second death, a ritual like this has grounds to exist.
    const deaths = (gs.tr?.rounds || []).filter(r => r.murdered).length;
    return deaths >= 2 ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      lineFor(TOAST_LINES, `grief-toast-to-them|${ctx.ep}`, { a, b }));
    return { branch: 'toasted', pair: [a, b], threadId: thread?.id, cited, bondDelta: 2 };
  },
});

// ONCE PER SEASON, so it never repeats WITHIN a castle — but a reader who
// watches four seasons meets it four times, and it read identically all four.
// Every line here still asserts the ROOM crossed the threshold, which is the
// claim `oncePerSeason` is defending; see the long note on the flag below.
const NUMB_LINES = [
  'The castle had stopped flinching at the empty chair. {a} said so out loud to {b}, and hated that nobody argued.',
  'Nobody looked up when the number changed this morning. {a} pointed that out to {b}, and the room let it stand.',
  'Breakfast happened at the normal speed today. {a} said to {b} that it should not have, and {b} had no answer to that.',
  'Somewhere in the last few days the castle had started treating this as weather. {a} named it to {b}; nobody in earshot disagreed.',
  'The room had got good at this. {a} said the words to {b} and hated every one of them, and still nobody argued.',
];

registerEvent({
  id: 'grief-numb-to-it-now',
  family: FAMILY,
  window: 'dawn',
  acts: { late: 2 },
  // ONCE PER SEASON (spec 5.4.2, 'signature moments cannot cheapen
  // themselves').
  //
  // THE RULE: the flag belongs on an event whose text asserts that THE CASTLE
  // has crossed a line, because a second firing of such a text contradicts the
  // first - the line cannot be crossed twice. It does NOT belong on an event
  // about how one person feels on one morning, however big that feeling is.
  //
  // AND THE LINE BELOW WAS REWRITTEN TO MEET THAT RULE, RATHER THAN THE RULE
  // BENT TO FIT THE LINE (Task 5 round 2, R1). It used to read "{a} told {b}
  // the empty chair barely registered anymore, and hated how true that was" -
  // a claim about {a}, indistinguishable in kind from `grief-empty-chair` or
  // `grief-headcount`, which this comment then contrasted itself against. Two
  // people acclimatising on two different mornings is perfectly coherent, so
  // the justification was post-hoc and the flag was doing something the words
  // did not ask for. Review caught it, and the honest options were to change
  // the words or to change the rule. The words changed: the beat is now the
  // room's threshold, witnessed by two people, and "the castle had stopped
  // flinching" is a thing that becomes true once and stays true.
  //
  // So the precedent this sets for the next person is narrow on purpose: tag
  // `oncePerSeason` when a SECOND firing would make the FIRST untrue, and
  // check that against the sentence the event actually writes.
  oncePerSeason: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const deaths = (gs.tr?.rounds || []).filter(r => r.murdered).length;
    return deaths >= 2 && _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(NUMB_LINES, `grief-numb-to-it-now|${ctx.ep}`, { a, b }));
    // No bond move — the point of this one IS the absence of a felt reaction.
    return { branch: 'numb', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 0 };
  },
});

const CRIES_ALONE_LINES = [
  '{a} found somewhere nobody could see them and let it out, alone, before breakfast.',
  '{a} went to the far end of the corridor to do it where the walls were thick enough.',
  'Nobody saw {a} between the bell and breakfast, and {a} came down with a very carefully arranged face.',
  '{a} cried in the one room of the castle with no window in the door, and then washed their face and went down.',
  'It came out of {a} all at once, in private, and was finished and put away before anybody else was up.',
];

registerEvent({
  id: 'grief-someone-cries-alone',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 1) return 0;
    if (!_victimLastNight(ctx.ep)) return 0;
    // SPEC 5.3, EMOTIONAL STATE. The person who goes off on their own to fall
    // apart is overwhelmingly the person the room was voting for last night.
    // ctx.state is READ-ONLY here: a frozen view of the round record.
    return isNervy(ctx.state?.[ctx.actors[0]]) ? 2.5 : 1;
  },
  fire(ctx) {
    const actor = ctx.actors[0];
    const state = ctx.state?.[actor];
    const why = state === 'desperate'
      ? ` It was not really about the empty chair; ${actor} had watched the room write their own name down and was still counting.`
      : state === 'paranoid'
        ? ` Somebody had said ${actor}'s name at that table, and it had not stopped ringing since.`
        : '';
    const line = lineFor(CRIES_ALONE_LINES, `grief-someone-cries-alone|${ctx.ep}|${state || 'content'}`,
      { a: actor });
    const t = openThread(FAMILY, [actor], ctx.ep, `${line}${why}`);
    return { branch: 'cried-alone', actor, threadId: t?.id, state: state || 'content' };
  },
});

// ROUND 1 FIX: this event originally gated on `alignmentAt(v, ep - 1) ===
// 'traitor'` — the murder victim having secretly been a Traitor. That
// precondition is IMPOSSIBLE under the current engine: murder.js's target
// pool is `livingFaithfuls(ep).filter(...)` (js/tr/murder.js, the line
// choosing who the conclave can even consider) — the Traitors never
// murder one of their own, so `_victimLastNight` can never resolve to a
// Traitor. Zero firings across a 60-season dead-event sweep confirmed it
// (not a rare state; an unreachable one — the exact distinction the brief
// draws). Rare-state amplification cannot rescue a precondition that never
// clears, so the fix is a different, REACHABLE irony rather than a
// loosened gate on the same impossible one: the room mourning someone who
// spent their last days under a suspicion — from suspicion.js's own
// threads — that never led anywhere and now never will. Murder victims are
// always Faithfuls, and Faithfuls collect suspicion threads constantly, so
// this fires routinely instead of never.
const WRONGLY_SUSPECTED_LINES = [
  '{a} and {b} realized, too late, that {v} had spent their last days under a suspicion that never actually went anywhere.',
  'Whatever {a} and {b} had thought about {v} last week, they were not going to get to find out now.',
  '{b} reminded {a} what they had both been saying about {v} three days ago. Neither of them enjoyed the reminder.',
  '{v} had been answering questions right up until the end, and {a} and {b} worked out this morning that none of them had mattered.',
  'The case against {v} died with {v}, and {a} and {b} were the only two still holding it.',
];

registerEvent({
  id: 'grief-wrongly-suspected-irony',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const v = _victimLastNight(ctx.ep);
    if (!v) return 0;
    const threads = gs.tr?.threads || [];
    return threads.some(t => t.kind === 'suspicion' && t.parties.includes(v)) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(WRONGLY_SUSPECTED_LINES, `grief-wrongly-suspected-irony|${ctx.ep}`, { a, b, v }));
    return { branch: 'wrongly-suspected-irony', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 1 };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// The `night` window runs after the Round Table, so `ctx.state` here is the
// state of the room AS OF TONIGHT'S VOTE, not yesterday's - see the note on
// emotionalStateOf in events.js, which walks through which windows see which
// table. That is the whole point of putting a grief event here: somebody who
// watched the room write their name down tonight is lying awake with the
// empty rooms, and that is a different scene from the one at breakfast.

// FOUR VARIANTS PER STATE, not two. This event is solo-capable and `night` is
// a thin window, so it draws several times in a single season - the audit's
// within-season repetition table caught it at five firings of one branch in one
// season with a two-line pool, which is how a castle starts reading as a loop.
const NIGHT_AWAKE_LINES = {
  desperate: [
    '{a} did not sleep. They had watched the room write their own name down and then had to lie in the dark and count how many.',
    'It was not the empty beds keeping {a} awake. It was the number of people who had said their name at that table.',
    '{a} went over the ballots in the dark until the order they had been read out stopped meaning anything.',
    'There is no version of tonight {a} could lie down with, and {a} tried all of them before it got light.',
    '{a} spent the night deciding what to say in the morning, and threw all of it away by five.',
    'Somebody in this building had written {a}\'s name down tonight, and {a} lay there going through who.',
  ],
  paranoid: [
    'Somebody had said {a}\'s name tonight, and {a} spent the dark working out who else had been thinking it.',
    '{a} lay awake going through the room one by one, deciding which of them had meant it.',
    'One name said out loud at that table was enough to keep {a} up until the corridor started making noises.',
    '{a} kept coming back to who had looked away first, and could not let the question go long enough to sleep.',
    'Every time {a} nearly went under, the room reassembled itself behind their eyes and started talking again.',
    '{a} counted who had been kind to them today and could not decide what any of it had meant.',
  ],
  content: [
    '{a} lay awake with the empty beds, doing the arithmetic nobody says out loud.',
    'The castle went very quiet at night once there were fewer people in it, and {a} noticed.',
    '{a} listened to a building built for a lot more people than were still in it.',
    'It took {a} a long time to get to sleep, and it was not fear, and it was not nothing either.',
    '{a} could hear how much room there was above them, and had never noticed the ceiling before.',
    'The corridor settles at night, and {a} lay listening to a building doing nothing in particular.',
  ],
};

registerEvent({
  id: 'grief-nobody-sleeps',
  family: FAMILY,
  window: 'night',
  weight(ctx) {
    if (ctx.actors?.length !== 1) return 0;
    // The castle has to have lost somebody for there to be an empty room.
    if (!(gs.tr?.rounds || []).some(r => r.murdered)) return 0;
    return isNervy(ctx.state?.[ctx.actors[0]]) ? 2.5 : 1.2;
  },
  fire(ctx, rng) {
    const actor = ctx.actors[0];
    const state = ctx.state?.[actor] || 'content';
    // EVERY empty bed, not only the murdered ones. The weight above needs a
    // murder to have happened (this is the grief family, and a banishment is
    // something the room did in daylight), but the thing a person counts at
    // three in the morning is how many beds are empty, and a banishment
    // empties one exactly as thoroughly.
    const gone = (gs.tr?.rounds || []).reduce((n, r) => n + (r.murdered ? 1 : 0) + (r.banished ? 1 : 0), 0);
    const line = pick(rng, NIGHT_AWAKE_LINES[state] || NIGHT_AWAKE_LINES.content)
      .replace(/\{a\}/g, actor);
    const tail = gone === 1 ? 'One empty bed, so far.' : `${gone} empty beds, so far.`;
    const t = openThread(FAMILY, [actor], ctx.ep, `${line} ${tail}`);
    // THE BRANCH IS THE STATE. Returning a constant label made the audit's
    // (id, branch) table read this as one outcome fired five times in a
    // season when it is three genuinely different scenes chosen by the last
    // Round Table, and that table is how repetition gets noticed at all.
    return { branch: `awake-${state}`, actor, state, gone, threadId: t?.id };
  },
});
