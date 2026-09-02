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
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { _sentenceCase } from './cover.js';
import { findOpenThread } from '../threads.js';
import { alignmentAt } from '../roles.js';
import { lineFor } from './lines.js';
import { peopleLost, murderCount } from '../state.js';

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
    const api = sceneApi(ctx, 'grief-empty-chair');
    const sceneWhy = 'the missing person\'s place at the table';
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    api.addBond(a, b, 1, { source: sceneWhy });
    const note = pick(rng, EMPTY_CHAIR_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{v\}/g, v);
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'empty-chair', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 1 };
  },
});

// ── REWRITE (Task 7 stage 5). `grief-headcount` had two branches and they
// were SHAPES, not outcomes: `headcount-pair` and `headcount-solo` are the
// same beat with a different number of people watching it. `headcount-solo`
// was the ninth-loudest repeat in the pool. So the shape stays (a solo draw
// still gets a solo scene) and a real fork goes on top of it: what somebody
// does once they have the number.
//
// THE RECORD IS THE NUMBER ITSELF — `ctx.living.length`, which every person
// in the castle can arrive at by looking round the table, and which is the
// only fact any branch here asserts. What varies is whether it gets said out
// loud, refused, turned into a list of who is left that they would trust, or
// counted against the number they started with.
const HEADCOUNT_LINES = {
  'said-the-number': [
    '{a} said it out loud so {b} did not have to: {n} of them left.',
    '{a} got to {n} and stopped. {b} had got there first and had not wanted to be the one to say it.',
    '"{n}," said {a}, to nobody in particular, and {b} did not correct them.',
    '{b} watched {a} count the room on their fingers and get to {n} both times.',
    '{a} and {b} arrived at {n} separately and then had to sit with it together.',
    '{b} said the number first. {a} had been hoping to get through breakfast without hearing it.',
    'Neither {a} nor {b} needed to count. Both of them did, and both of them got {n}.',
    '{a} started to say how many were left, stopped, and {b} finished it: {n}.',
  ],
  'left-it-unsaid': [
    '{b} asked {a} how many were left and {a} would not answer, which was its own answer.',
    '{a} began to count out loud and {b} put a hand up and stopped them at four.',
    '"Don\'t," {b} said, before {a} had got the number out, and {a} did not.',
    '{a} knew the number and {b} knew the number and neither of them was going to be the one to say {n}.',
    '{b} changed the subject twice to stop {a} getting to the end of the table.',
    'They spent breakfast very carefully not counting, {a} and {b}, and both of them noticed the other doing it.',
    '{a} asked, and {b} said they had stopped keeping track, which was not true and both of them knew it.',
    '{b} would not have the number said at the table. {a} let them have that.',
  ],
  'counted-the-chairs': [
    '{a} counted the chairs instead of the people, which came to the same thing.',
    '{a} counted the castle twice, like the number might change.',
    '{a} counted the room, got {n}, and counted it again to be sure of something.',
    'There were {n} of them. {a} had known that before counting and counted anyway.',
    '{a} did the arithmetic without meaning to, the way you check a pocket for keys.',
    '{a} counted heads at breakfast and could not stop doing it for the rest of the morning.',
    '{a} had known it was {n} before counting, and had counted three times since getting up anyway.',
    'Somewhere between the stairs and the table {a} had done the sum again without deciding to.',
    '{a} counted the cups on the drainer, which is a slower way to get to {n} and gave the same answer.',
    '{a} got to {n} and then started again from the other end of the table to see if it came out different.',
  ],
  'counted-the-useful-ones': [
    '{a} was not counting people this morning. {a} was counting which of the {n} would still be standing next to them next week.',
    '{n} left, and {a} could name the four who mattered and did, silently, twice.',
    '{a} went round the table working out not how many were left but how many were any use.',
    'It was not a headcount so much as an inventory, and {a} did not enjoy how short the useful half was.',
    'There are {n} people in this castle and {a} spent breakfast sorting them into two piles.',
    '{a} did the sum, and then did the more frightening sum underneath it.',
    '{n} of them, and {a} had a number for the ones who would take a bullet and it was very much smaller.',
    '{a} counted the room and then counted it again with most of the room left out.',
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
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['strategic', 'social', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-headcount');
    const actors = ctx.actors;
    const remaining = (ctx.living || []).length;
    const v = _victimLastNight(ctx.ep);
    const st = pStats(actors[0]);
    // THE SHAPE STILL DECIDES THE BRANCH SET — two people can refuse a number
    // to each other and one person alone cannot — and the stats choose within
    // it. Same rule the stage-4 library uses: the record picks the set.
    let branch;
    if (actors.length === 2) {
      const say = (st.social / 10) * 0.5 + (st.boldness / 10) * 0.4 + 0.15;
      const wont = (1 - st.boldness / 10) * 0.5 + (st.loyalty / 10) * 0.3;
      branch = rng() * (say + wont) < say ? 'said-the-number' : 'left-it-unsaid';
    } else {
      const chairs = (st.temperament / 10) * 0.4 + 0.3;
      const useful = (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.3;
      branch = rng() * (chairs + useful) < chairs ? 'counted-the-chairs' : 'counted-the-useful-ones';
    }
    const sceneWhy = branch === 'left-it-unsaid' ? 'would not say the number out loud'
      : branch === 'counted-the-useful-ones' ? 'counted who was left that was any use to them'
        : 'counted the room and found it shorter';
    const note = lineFor(HEADCOUNT_LINES[branch], `grief-headcount|${branch}|${ctx.ep}|${remaining}`,
      { a: actors[0], b: actors[1] || 'somebody', n: String(remaining) });
    const t = api.openArc(FAMILY, actors, { source: sceneWhy, seed: note });
    let bondDelta = 0;
    if (branch === 'said-the-number') bondDelta = 1;
    else if (branch === 'left-it-unsaid') bondDelta = 0.5;
    if (bondDelta) api.addBond(actors[0], actors[1], bondDelta, { source: sceneWhy });
    const out = { branch, actors, victim: v, remaining, threadId: t?.id, bondDelta };
    if (actors.length === 2) { out.pair = [actors[0], actors[1]]; }
    return out;
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
    const api = sceneApi(ctx, 'grief-seating-shift');
    const sceneWhy = 'the seats moved around the gap';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, lineFor(RESEATED_LINES, `grief-seating-shift|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
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
    const api = sceneApi(ctx, 'grief-shared-mourning-bond');
    const sceneWhy = 'mourned the same person together';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 2, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(SHARED_MOURNING_LINES, `grief-shared-mourning-bond|${ctx.ep}`, { a, b });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
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
    const api = sceneApi(ctx, 'grief-suspicion-of-timing');
    const sceneWhy = 'read something into who was taken and when';
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    api.addBond(a, b, 1, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, lineFor(TIMING_LINES, `grief-suspicion-of-timing|${ctx.ep}`, { a, b, v }),
      { source: sceneWhy });
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
    const api = sceneApi(ctx, 'grief-morning-reaction');
    const sceneWhy = 'how they took the news at breakfast';
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
    if (bondDelta) api.addBond(reactor, partner, bondDelta, { source: sceneWhy });
    const threadId = api.openArc(FAMILY, parties, { source: sceneWhy, seed: line })?.id;

    return { branch, reactor, partner, victim, isTraitor, archetype, threadId, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

// ── REWRITE (Task 7 stage 5). `grief-keepsake:keepsake` was the single
// loudest source of within-season repetition in the whole castle — 18 of the
// 144 seasons that printed a sentence three times, measured over 800, more
// than any other (event, branch) key in the pool. It was one branch over a
// five-line pool on a dawn event that draws several times a season, which is
// the arithmetic: with F firings over a pool of P, a triple runs at about
// C(F,3)/P-squared, so the fix has to attack BOTH terms — split F across
// branches, and widen P.
//
// FOUR THINGS A PERSON ACTUALLY DOES WITH A DEAD PERSON'S BELONGINGS, and
// they are four different scenes rather than four wordings of one: keep it,
// give it to whoever will want it most, put it back, or set it out where the
// room has to look at it. The record that makes each true is the same one the
// old version read — somebody was taken last night — plus the stored bond
// between the person doing it and the person who is gone, which is what
// decides whether this is theirs to keep at all.
const KEEPSAKE_LINES = {
  pocketed: [
    '{a} took one thing off {v}\'s side of the room before anybody else went in, and never said what.',
    'It was not worth anything. {a} put it in a pocket anyway and kept checking it was still there.',
    'Something of {v}\'s went missing from the room before breakfast. {a} knew exactly where it was.',
    '{a} quietly kept something small of {v}\'s. Nobody asked, and {a} did not offer.',
    'Whatever {a} lifted from {v}\'s bedside, it was small enough to close a hand around, and {a} did, all morning.',
    '{a} went up before the others were awake and came down with one of {v}\'s things and a very ordinary face.',
    'There was a thing of {v}\'s that {a} did not want the castle to divide up, so {a} took it first.',
    '{a} kept one thing and left the rest, and could not have told anybody why that thing.',
    'By the time the room was opened up again the only thing missing was small, and {a} had it.',
    '{a} did not think of it as taking. {a} thought of it as not leaving it there.',
  ],
  'handed-it-over': [
    '{a} found something of {v}\'s and put it straight into {c}\'s hands, because {c} was the one who would want it.',
    '{a} did not keep it. {a} gave it to {c}, who had been closer to {v} than anybody, and said nothing else about it.',
    '"This should be yours," {a} said, and {c} did not trust themselves to answer.',
    '{a} carried one of {v}\'s things down the stairs, found {c}, and handed it over without a speech.',
    '{a} could have kept it. {a} gave it to {c} instead, and {c} noticed which of those {a} had chosen.',
    'It took {a} about a minute to decide the thing belonged with {c}, and about ten seconds to say so.',
    '{a} put it down in front of {c} at breakfast and went to get the tea, which was the kindest way to do it.',
    '{c} had not asked for anything of {v}\'s. {a} brought it anyway.',
  ],
  'put-it-back': [
    '{a} took one of {v}\'s things, held it for a while, and then went back up and put it exactly where it had been.',
    'It felt wrong in {a}\'s pocket by about nine o\'clock, and it was back on the shelf by ten.',
    '{a} got as far as the stairs with it and then turned round.',
    '{a} decided the room could keep what was in it, and left {v}\'s side of it untouched after all.',
    'Whatever {a} had meant to keep, {a} put it back, and did not tell anybody either half of that.',
    '{a} squared {v}\'s things up neatly on the shelf and took none of them, which took longer than taking one would have.',
    'For about an hour {a} owned something of {v}\'s. Then {a} did not, and the shelf looked the same as before.',
    '{a} folded {v}\'s jumper properly, put it where it went, and shut the door on it.',
  ],
  'set-it-out': [
    '{a} put one of {v}\'s things on the table at breakfast, in the empty place, and dared the room to move it.',
    'Nobody had asked for a memorial. {a} made a small one out of a book and a mug and left it where everyone ate.',
    '{a} set something of {v}\'s down in front of the empty chair and sat back down without explaining it.',
    'It was on the table by the time the rest of them came down: one of {v}\'s things, exactly where {v} had sat.',
    '{a} would not let the morning happen as though yesterday had not, and put something of {v}\'s in the middle of it.',
    '{a} laid it out where the whole room would have to walk past it, which was the point.',
    'Half the castle pretended not to see what {a} had put on the table. The other half could not stop looking at it.',
    '{a} said nothing at all, put {v}\'s cup back on the table, and let that be the sentence.',
  ],
};

registerEvent({
  id: 'grief-keepsake',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'social', 'temperament', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-keepsake');
    const actor = ctx.actors[0];
    const v = _victimLastNight(ctx.ep);
    const st = pStats(actor);
    // WHO ELSE WANTED IT. The person still living with the strongest stored
    // bond to the person who is gone — a record the castle made over the
    // whole season, not an assertion invented for the scene. Without one, the
    // giving branch has nobody to give to and is scored at zero.
    let keeper = null, keeperBond = 0;
    for (const n of (ctx.living || [])) {
      if (n === actor || n === v) continue;
      const bnd = getBond(n, v);
      if (bnd > keeperBond) { keeper = n; keeperBond = bnd; }
    }
    const mine = getBond(actor, v);
    const scores = {
      pocketed: (st.loyalty / 10) * 0.5 + Math.max(0, mine) / 10 * 0.5 + 0.15,
      'handed-it-over': keeper ? (st.social / 10) * 0.5 + Math.max(0, keeperBond - mine) / 10 * 0.5 : 0,
      'put-it-back': (st.temperament / 10) * 0.5 + Math.max(0, -mine) / 10 * 0.3 + 0.1,
      'set-it-out': (st.boldness / 10) * 0.45 + (st.social / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((t, k) => t + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'handed-it-over'
      ? 'gave away something belonging to the person who was taken'
      : branch === 'put-it-back' ? 'could not keep anything of the person who was taken'
        : branch === 'set-it-out' ? 'put the missing person\'s things where the room had to see them'
          : 'kept something of the person who was taken';
    const parties = branch === 'handed-it-over' ? [actor, keeper] : [actor];
    const note = lineFor(KEEPSAKE_LINES[branch], `grief-keepsake|${branch}|${ctx.ep}`,
      { a: actor, v, c: keeper || 'somebody' });
    const t = api.openArc(FAMILY, parties, { source: sceneWhy, seed: note });
    let bondDelta = 0;
    if (branch === 'handed-it-over') {
      bondDelta = 2;
      api.addBond(actor, keeper, bondDelta, { source: sceneWhy });
    }
    // TERMINAL. Putting it back is the one branch with no next beat in it:
    // the thing is where it was and nobody knows either half happened. The
    // arc is opened so the scene PRINTS (a branch that writes no beat prints
    // nothing — see the silence floor in tests/tr-castle-prose.test.js) and
    // then closed as `buried`, which is what that outcome means.
    if (branch === 'put-it-back' && t) api.resolveArc(t.id, 'buried', { source: sceneWhy });
    const out = { branch, actor, victim: v, threadId: t?.id, bondDelta };
    if (branch === 'handed-it-over') { out.pair = [actor, keeper]; out.speaker = actor; out.respondent = keeper; }
    if (branch === 'set-it-out') out.crowd = { name: actor, colour: 'kind', mult: 0.4 };
    return out;
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
    const api = sceneApi(ctx, 'grief-blame-the-room');
    const sceneWhy = 'blamed the room out loud for the death';
    const [a, b] = ctx.actors;
    api.addBond(a, b, -0.5, { source: sceneWhy });
    const v = _victimLastNight(ctx.ep);
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(BLAME_ROOM_LINES, `grief-blame-the-room|${ctx.ep}`, { a, b, v }) });
    return { branch: 'blamed-room', pair: [a, b], victim: v, threadId: t?.id, bondDelta: -0.5 };
  },
});

// ── REWRITE (Task 7 stage 5). Third on the blame table once `runWindow`’s
// barren-draw fix opened `evening` up: one branch over an eight-line pool, on
// the only grief event in the window.
//
// A TOAST IS A THING THAT CAN GO WRONG, and the old version could not. Four
// ways it goes, and the fork is the room’s as much as the pair’s:
//
//   named-them-all   — they get through the whole list, in order, and it is
//                      the ceremony it was meant to be.
//   could-not-finish — the list is too long now, and one of them stops.
//   turned-into-a-vow— it stops being about the dead and becomes a promise
//                      about the living, which is what a castle does to
//                      mourning by about week three.
//   nobody-joined-in — they raise it and the room carries on eating, which is
//                      its own fact about where the castle has got to.
//   poured-two       — THE SOLO BRANCH. One glass, one name, nobody watching.
//                      Widening rather than a new event: measured over 60
//                      seasons, a solo draw in `evening` faced 0.51 eligible
//                      events against a pair draw’s 8.49.
//
// THE RECORD IS `murderCount(gs)` AND `peopleLost(gs)` — how many the castle
// has actually lost, which is a number every person in the building can count
// off the empty chairs, and it is the only quantity any of these lines
// asserts.
const TOAST_LINES = {
  'named-them-all': [
    '{a} and {b} raised a glass, quietly, to everyone the castle had already lost.',
    'They went through the names, {a} and {b}, in order, and drank once at the end of the list.',
    '{a} poured two, handed one to {b}, and they got through all {n} of them without stopping.',
    'It was not a ceremony. {a} said a name, {b} said a name, and they went on until there were none left to say.',
    '{a} lifted a glass to the empty end of the table and {b} lifted one back, and then they did it properly, name by name.',
    '{a} and {b} drank to the ones who went first, which by now was most of the people they came in with.',
  ],
  'could-not-finish': [
    '{b} started to make a toast, could not finish it, and {a} did not finish it either.',
    'They got four names in and {a} put the glass down, and neither of them picked it back up.',
    '{a} had not realised how long the list had got until {a} was halfway through saying it out loud.',
    'The toast stopped somewhere in the middle. {b} said it was fine. It was not especially fine.',
    '{a} and {b} meant to do all {n} of them and managed about half before it turned into something else.',
    'It is harder than it sounds to say that many names in a row, and {a} found that out in front of {b}.',
  ],
  'turned-into-a-vow': [
    'It started as a toast to the dead and ended as {a} and {b} promising something to each other about tomorrow.',
    '{a} raised a glass to the ones who had gone and then, in the same breath, to the two of them getting further.',
    '"To them," {b} said. "And to us not joining them," said {a}, and they drank on it like an agreement.',
    'By the end of it {a} and {b} were not really talking about the dead any more, and both of them knew when it had turned.',
    'The names ran out and what was left was {a} and {b} deciding, out loud, that they were in this together.',
    '{a} and {b} started the evening mourning and finished it with an arrangement, which is what this place does.',
  ],
  'nobody-joined-in': [
    '{a} and {b} raised a glass to the dead and the rest of the room carried on eating.',
    'Nobody else stood up. {a} and {b} drank anyway, and felt every second of the room not joining in.',
    '{a} said the names loudly enough for the table to hear and the table did not hear them.',
    'It was meant to be for everybody. It ended up being for {a} and {b}, in front of everybody.',
    '{b} looked round for somebody else to lift a glass and could not find one.',
    'The castle has got good at going on with its dinner, and {a} and {b} found that out with two glasses in the air.',
  ],
  'poured-two': [
    '{a} poured two and drank one, and left the other where it was.',
    'Nobody was there for it. {a} said one name out loud and drank to it alone.',
    '{a} did the whole list under their breath, all {n} of them, standing at the sink.',
    'There was no ceremony in it. {a} raised a glass to an empty kitchen and put it down again.',
    '{a} had meant to find somebody to do this with and had not, and did it anyway.',
    'It is a small thing to do on your own and {a} did it every night now.',
    '{a} left a full glass on the table for nobody and went up.',
    '{a} got as far as saying two of the names and decided that was enough for tonight.',
    'The castle was noisy in the other room. {a} stayed where it was quiet and drank to {n} people.',
    'Nobody needed to see {a} do it, and that was rather the point of doing it there.',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['social', 'temperament', 'loyalty'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    // WIDENED TO A SOLO DRAW (Task 7 stage 5) — see the header.
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    // Reachable, uncommon state: the castle has lost more than one person —
    // by the second death, a ritual like this has grounds to exist.
    const deaths = murderCount(gs);
    return deaths >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-toast-to-them');
    const [a, b] = ctx.actors;
    const gone = peopleLost(gs);
    if (!b) {
      const soloWhy = 'drank to the ones who had gone, alone';
      const note = lineFor(TOAST_LINES['poured-two'], `grief-toast-to-them|poured-two|${ctx.ep}|${gone}`,
        { a, n: String(gone) });
      const solo = arcContinue(api, FAMILY, [a], ctx.ep, note, { source: soloWhy });
      return { branch: 'poured-two', actor: a, gone, threadId: solo.thread?.id,
        cited: solo.cited, bondDelta: 0 };
    }
    const st = pStats(b);
    const scores = {
      'named-them-all': (st.temperament / 10) * 0.45 + (st.loyalty / 10) * 0.3,
      'could-not-finish': (1 - st.temperament / 10) * 0.45 + Math.min(0.4, gone / 12),
      'turned-into-a-vow': (st.strategic / 10) * 0.4 + Math.max(0, getBond(a, b)) / 10 * 0.35,
      'nobody-joined-in': (1 - st.social / 10) * 0.35 + 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'could-not-finish' ? 'could not get to the end of the list of names'
      : branch === 'turned-into-a-vow' ? 'turned a toast to the dead into a promise about tomorrow'
        : branch === 'nobody-joined-in' ? 'raised a glass the room did not join'
          : 'raised a glass to the people who had been taken';
    const bondDelta = branch === 'named-them-all' ? 2
      : branch === 'could-not-finish' ? 1.5 : branch === 'turned-into-a-vow' ? 2.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(TOAST_LINES[branch], `grief-toast-to-them|${branch}|${ctx.ep}|${gone}`,
      { a, b, n: String(gone) });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], gone, threadId: thread?.id, cited, bondDelta,
      crowd: [{ name: a, colour: 'kind', mult: 0.5 }, { name: b, colour: 'kind', mult: 0.5 }] };
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
    const deaths = murderCount(gs);
    return deaths >= 2 && _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'grief-numb-to-it-now');
    const sceneWhy = 'stopped feeling the mornings';
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(NUMB_LINES, `grief-numb-to-it-now|${ctx.ep}`, { a, b }) });
    // No bond move — the point of this one IS the absence of a felt reaction.
    return { branch: 'numb', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 0 };
  },
});

// ── REWRITE (Task 7 stage 5). `grief-someone-cries-alone:cried-alone` was the
// fourth-loudest repeat in the pool (8 of 144 loud seasons over 800). It is a
// SOLO event, which is the structural half of the problem: a solo branch is
// the only branch its event has on a solo draw, so every one of that event's
// firings in a season came out of one five-line pool.
//
// The fix is the same one the whole stage is built on — the person going off
// on their own to fall apart is the premise, and what happens NEXT is where
// the fork belongs. Four different mornings: it is finished and put away
// before anybody is up; somebody finds them; they do not come down at all and
// the room notices; or it comes back down the stairs as anger rather than
// grief. The record underneath is unchanged and is the one the old version
// read — somebody was taken last night — plus `ctx.state`, the public ballots
// of the last Round Table, which is what says whether this person was already
// carrying something before the empty chair was there.
const CRIES_ALONE_LINES = {
  'put-it-away': [
    '{a} found somewhere nobody could see them and let it out, alone, before breakfast.',
    '{a} went to the far end of the corridor to do it where the walls were thick enough.',
    '{a} cried in the one room of the castle with no window in the door, then washed their face and went down.',
    'It came out of {a} all at once, in private, and was finished and put away before anybody else was up.',
    'Nobody saw {a} between the bell and breakfast, and {a} came down with a very carefully arranged face.',
    '{a} gave it four minutes in the boot room and then gave it nothing else all day.',
    'Whatever happened to {a} upstairs was over by the time the stairs creaked under anybody else.',
    '{a} ran a tap for longer than washing takes, and came down with the same face as everybody.',
    'It took {a} about as long as it takes to make a bed, and {a} made the bed afterwards too.',
    '{a} did it standing up, quickly, the way you do a thing you have decided to be finished with.',
  ],
  'was-found': [
    '{c} went looking for a coat and found {a} instead, and did not say a word about it to anybody.',
    '{a} did not hear {c} come in. {c} sat down on the floor beside them and stayed until it stopped.',
    '{c} found {a} in the stairwell, said nothing at all, and put a hand on their shoulder for a long time.',
    'It was {c} who found {a}, and {c} who decided the rest of the castle did not need to know.',
    '{a} was very embarrassed to be found. {c} said the only correct thing, which was nothing.',
    '{c} came round the corner at the wrong moment and made it the right one by staying.',
    'Somebody was always going to walk in. It was {c}, and {c} shut the door behind them.',
    '{a} apologised to {c} twice for it. {c} would not accept either one.',
  ],
  'did-not-come-down': [
    '{a} did not come down for breakfast, and the castle worked out why without anybody saying it.',
    'There was a plate laid for {a} and it stayed laid. Nobody moved it and nobody mentioned it.',
    '{a} stayed upstairs through the whole meal, and the room got quieter the longer it went on.',
    'Two people went up to knock on {a}\'s door and both of them came back down alone.',
    'The castle ate breakfast one person shorter than it had to be, and everybody knew which one.',
    '{a} could not make themselves do the stairs this morning, and the room downstairs heard the not-doing.',
    'Somebody asked where {a} was. Nobody answered, and the question did not get asked twice.',
    'By the time {a} came down it was the middle of the morning and the plate had been cleared.',
  ],
  'came-down-angry': [
    'Whatever {a} did upstairs, it came back down as temper, and the first person to speak to {a} got the end of it.',
    '{a} came down dry-eyed and furious, which is a thing grief does and nobody in the room had a name for.',
    'It turned somewhere on the stairs. {a} arrived at breakfast looking for an argument and found one.',
    '{a} had cried it out and come down hard, and spent the morning being sharp with people who had not earned it.',
    'Nobody could work out what they had done to {a}. Nobody had done anything to {a}.',
    '{a} snapped at the room over the milk, of all things, and then stood there hearing how it had sounded.',
    'The grief went in one end of {a} and came out the other as something with edges on it.',
    'By nine o\'clock {a} was not sad any more, which was worse for everybody standing near {a}.',
  ],
};

registerEvent({
  id: 'grief-someone-cries-alone',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'boldness'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 1) return 0;
    if (!_victimLastNight(ctx.ep)) return 0;
    // SPEC 5.3, EMOTIONAL STATE. The person who goes off on their own to fall
    // apart is overwhelmingly the person the room was voting for last night.
    // ctx.state is READ-ONLY here: a frozen view of the round record.
    return isNervy(ctx.state?.[ctx.actors[0]]) ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-someone-cries-alone');
    const actor = ctx.actors[0];
    const state = ctx.state?.[actor];
    const st = pStats(actor);
    // WHO WOULD HAVE FOUND THEM. The living player with the strongest stored
    // bond to this one — the person most likely to be looking. No bond, no
    // finder, and the branch scores zero rather than inventing a witness.
    let finder = null, best = 0;
    for (const n of (ctx.living || [])) {
      if (n === actor) continue;
      const bnd = getBond(actor, n);
      if (bnd > best) { finder = n; best = bnd; }
    }
    const scores = {
      'put-it-away': (st.temperament / 10) * 0.6 + 0.2,
      'was-found': finder ? (st.social / 10) * 0.4 + Math.max(0, best) / 10 * 0.5 : 0,
      'did-not-come-down': (1 - st.temperament / 10) * 0.5 + (state === 'desperate' ? 0.4 : 0),
      'came-down-angry': (st.boldness / 10) * 0.4 + (state === 'paranoid' ? 0.3 : 0),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((t, k) => t + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'was-found' ? 'was found grieving away from the room'
      : branch === 'did-not-come-down' ? 'did not come down to breakfast at all'
        : branch === 'came-down-angry' ? 'came back down from it angry'
          : 'grieved away from the room and put it away again';
    // WHAT THE ROOM KNEW, AND WHY, said in the scene rather than asserted.
    // Both clauses cite the public ballots of the last Round Table — the thing
    // the whole castle watched happen — and neither reads anybody's role.
    const why = state === 'desperate'
      ? ` It was not really about the empty chair; ${actor} had watched the room write their own name down and was still counting.`
      : state === 'paranoid'
        ? ` Somebody had said ${actor}'s name at that table, and it had not stopped ringing since.`
        : '';
    const line = lineFor(CRIES_ALONE_LINES[branch],
      `grief-someone-cries-alone|${branch}|${ctx.ep}|${state || 'content'}`,
      { a: actor, c: finder || 'somebody' });
    const parties = branch === 'was-found' ? [actor, finder] : [actor];
    const t = api.openArc(FAMILY, parties, { source: sceneWhy, seed: `${line}${why}` });
    const out = { branch, actor, threadId: t?.id, state: state || 'content', bondDelta: 0 };
    if (branch === 'was-found') {
      out.bondDelta = 2;
      api.addBond(actor, finder, 2, { source: sceneWhy });
      out.pair = [finder, actor];
      out.speaker = finder;
      out.respondent = actor;
    }
    if (branch === 'came-down-angry') {
      // The scene is louder than the ballot that caused it, and the override
      // is the one channel a castle scene has for saying so (see
      // `emotionalStateOf`, js/tr/events.js). Live for this episode only.
      api.setEmotionalState(actor, 'paranoid', { source: sceneWhy });
    }
    return out;
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
    const api = sceneApi(ctx, 'grief-wrongly-suspected-irony');
    const sceneWhy = 'had suspected the person who was killed';
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    api.addBond(a, b, 1, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(WRONGLY_SUSPECTED_LINES, `grief-wrongly-suspected-irony|${ctx.ep}`, { a, b, v }) });
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
// SIX LINES A STATE WAS ENOUGH WHEN THIS EVENT FIRED 383 TIMES PER 400
// SEASONS. F1's gate correction (the first murder leaves no round record, so
// `rounds.some(r => r.murdered)` was false on the very night the castle first
// had an empty bed in it) took it to 553, and the repetition ceiling in
// tests/tr-castle-prose.test.js moved with it: seasons printing one sentence
// three times went 1.5% -> 2.28%, and two seasons in 3200 reached four.
//
// FOUR MORE PER STATE, AND THEY ARE FREE. `pick(rng, arr)` draws once whatever
// the array length is, so adding variants to an EXISTING pool consumes no
// extra rng draw and the firing table is bit-identical - the one content edit
// Plan 5's Task 8 correction measured as path-neutral by construction. This is
// the preferred route for exactly that reason; a new `pick()` call would have
// rerouted the season.
const NIGHT_AWAKE_LINES = {
  desperate: [
    '{a} did not sleep. They had watched the room write their own name down and then had to lie in the dark and count how many.',
    'It was not the empty beds keeping {a} awake. It was the number of people who had said their name at that table.',
    '{a} went over the ballots in the dark until the order they had been read out stopped meaning anything.',
    'There is no version of tonight {a} could lie down with, and {a} tried all of them before it got light.',
    '{a} spent the night deciding what to say in the morning, and threw all of it away by five.',
    'Somebody in this building had written {a}\'s name down tonight, and {a} lay there going through who.',
    '{a} rehearsed being surprised, in the dark, for a morning {a} was fairly sure would not come.',
    'Twice in the night {a} got as far as the door and both times sat back down on the end of the bed.',
    '{a} worked out, lying there, exactly which two people would have to change their minds, and could not think how.',
    'The dark did not help. {a} had run out of ways to make tomorrow come out differently by about two.',
  ],
  paranoid: [
    'Somebody had said {a}\'s name tonight, and {a} spent the dark working out who else had been thinking it.',
    '{a} lay awake going through the room one by one, deciding which of them had meant it.',
    'One name said out loud at that table was enough to keep {a} up until the corridor started making noises.',
    '{a} kept coming back to who had looked away first, and could not let the question go long enough to sleep.',
    'Every time {a} nearly went under, the room reassembled itself behind their eyes and started talking again.',
    '{a} counted who had been kind to them today and could not decide what any of it had meant.',
    '{a} listened to the corridor for a long time and could not decide whether it had gone quiet or always was.',
    'Somewhere in the dark {a} started ranking the room by who had not looked at them, which is no way to sleep.',
    'Every creak in the building was somebody deciding something about {a}, and {a} knew that was nonsense, and lay there anyway.',
    '{a} replayed one sentence from the table until they had heard four different meanings in it.',
  ],
  content: [
    '{a} lay awake with the empty beds, doing the arithmetic nobody says out loud.',
    'The castle went very quiet at night once there were fewer people in it, and {a} noticed.',
    '{a} listened to a building built for a lot more people than were still in it.',
    'It took {a} a long time to get to sleep, and it was not fear, and it was not nothing either.',
    '{a} could hear how much room there was above them, and had never noticed the ceiling before.',
    'The corridor settles at night, and {a} lay listening to a building doing nothing in particular.',
    '{a} slept badly and could not have told anybody what about, which was somehow worse.',
    'The place makes different noises with fewer people in it, and {a} had started noticing which.',
    '{a} lay there thinking about nothing much, in a room that used to have somebody else breathing in it.',
    'It is a big building to be quiet in, and {a} was awake for a good hour of it.',
  ],
};

registerEvent({
  id: 'grief-nobody-sleeps',
  family: FAMILY,
  window: 'night',
  weight(ctx) {
    if (ctx.actors?.length !== 1) return 0;
    // The castle has to have lost somebody for there to be an empty room.
    // SAME SOURCE AS THE COUNT BELOW (F1). `rounds.some(r => r.murdered)` is
    // false on the night of the first murder, because that murder has no round
    // record — so the one night the castle most obviously has an empty bed in
    // it was the one night this event could not fire.
    if (peopleLost(gs) < 1) return 0;
    // ── RARE-STATE AMPLIFICATION ON `desperate` (Task 7 stage 4) ─────────
    //
    // `awake-desperate` is the pool's rarest branch and it is rare for a good
    // reason: it needs somebody who took two-fifths of a ballot last night and
    // is still standing, which is a 3.5% state. Stage 4 put five more events
    // into `night` -- three of them solo-capable, where this event was one of
    // only two -- and measured what that cost: this branch fell from ~47
    // firings per 3,200 seasons to ~30, against the branch floor of 24 in
    // tests/tr-castle-reachability.test.js. A margin of six on a count whose
    // own resampling noise is larger than six is the knife-edge shape that
    // file refuses to ship, and it would have been MY crowding that put it
    // there.
    //
    // Spec 5.4's answer to exactly this is guard 2's own argument in prose: a
    // mechanism that can only fire in a narrow window must be weighted UP
    // inside it or it never appears at all. So the amplification is applied
    // where the narrow state actually is, rather than to the whole event --
    // `paranoid` (35% of actor-slots) keeps the weight it had, and only the
    // 3.5% state is lifted.
    const state = ctx.state?.[ctx.actors[0]];
    if (state === 'desperate') return 5;
    return isNervy(state) ? 2.5 : 1.2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-nobody-sleeps');
    const sceneWhy = 'the castle did not sleep';
    const actor = ctx.actors[0];
    const state = ctx.state?.[actor] || 'content';
    // EVERY empty bed, not only the murdered ones. The weight above needs a
    // murder to have happened (this is the grief family, and a banishment is
    // something the room did in daylight), but the thing a person counts at
    // three in the morning is how many beds are empty, and a banishment
    // empties one exactly as thoroughly.
    // FROM THE LIVING CAST, NOT FROM `rounds` (whole-plan review, F1). Night
    // one's murder leaves no round record, so summing `rounds` printed a
    // number that was short by at least one on every single firing — 363 of
    // 363 wrong across 200 seasons. `peopleLost` is cast minus living, which
    // cannot miss an exit that has no paperwork.
    const gone = peopleLost(gs);
    const line = pick(rng, NIGHT_AWAKE_LINES[state] || NIGHT_AWAKE_LINES.content)
      .replace(/\{a\}/g, actor);
    const tail = gone === 1 ? 'One empty bed, so far.' : `${gone} empty beds, so far.`;
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: `${line} ${tail}` });
    // THE BRANCH IS THE STATE. Returning a constant label made the audit's
    // (id, branch) table read this as one outcome fired five times in a
    // season when it is three genuinely different scenes chosen by the last
    // Round Table, and that table is how repetition gets noticed at all.
    return { branch: `awake-${state}`, actor, state, gone, threadId: t?.id };
  },
});
