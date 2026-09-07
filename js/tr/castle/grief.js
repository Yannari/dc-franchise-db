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

// ── THE BALLOT BEHIND A MOOD, OR NOTHING (fix round 1, C3) ────────────
//
// THE DEFECT, MEASURED: `grief-nobody-sleeps` printed "Somebody had said {a}'s
// name tonight" and "One name said out loud at that table..." off nothing but
// `ctx.state === 'paranoid'`, and 6.0% of paranoid firings (16 of 265 over 300
// seasons) had ZERO votes and ZERO accusations against that person at the last
// table — including episode one, before any Round Table has been held at all.
// A sentence about a ballot that no ballot supports is exactly what the causal
// writing contract exists to prevent, and no assertion in the suite could see
// it, because the branch label and the firing counts were all perfectly healthy.
//
// WHERE THE UNGROUNDED STATE COMES FROM. `emotionalStateOf` (js/tr/events.js)
// derives `paranoid`/`desperate` from the round record, and that path really
// does require `votes >= 1` or two accusers — so the derivation is sound. The
// hole is the OVERRIDE path: `setEmotionalState` lets a scene declare a mood,
// and `mission-the-long-walk:caught-up-with-it` sets `paranoid` off a private
// hour on the road home where nobody said anything to anybody. On episode one
// there is no round at all, so an override is the ONLY way to be paranoid, and
// every one of those firings claimed a table that had not happened.
//
// THE FIX IS THE ONE `after-you-wrote-my-name` ALREADY USES: read the ballots.
// This returns the round the mood could have come from ONLY when that round
// actually names the person, so a line that cites the table is reachable only
// when the table can be cited. It deliberately reads `rounds[rounds.length-1]`
// — the same record `emotionalStateOf` read — rather than `table(ctx)`, which
// requires tonight's: `night` sees tonight's table and `dawn` sees last
// night's, and both are a real ballot this person's name was really on.
function _ballotBehind(actor) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last || !actor) return null;
  const voted = (last.ballots || []).some(b => b.voted === actor);
  const named = (last.accusations || []).some(a => a.target === actor);
  return (voted || named) ? last : null;
}

/**
 * The most recent person to leave, and how — murdered in the night or banished
 * in daylight. Used by the night vigil to NAME the empty bed and to branch the
 * grief on death-vs-banishment (see grief-vigil in vp-tr/castle-day.js). Walks
 * the rounds newest-first; falls back to cast-minus-living for a night-one loss
 * that has no round record yet.
 */
function _lastGone() {
  const rounds = gs?.tr?.rounds || [];
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].murdered) return { name: rounds[i].murdered, byMurder: true };
    if (rounds[i].banished) return { name: rounds[i].banished, byMurder: false };
  }
  const cast = Object.keys(gs?.tr?.alignment || {});
  const living = new Set(gs?.activePlayers || []);
  const g = cast.find(n => !living.has(n));
  return g ? { name: g, byMurder: true } : null;
}

/** Was there a murder in the round that just closed? Shared by every event below. */
function _victimLastNight(ep) {
  const rounds = gs?.tr?.rounds;
  if (!rounds) return null;
  const round = rounds.find(r => r.ep === ep - 1 && r.murdered);
  return round ? round.murdered : null;
}

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`empty-chair`) — the
// fork is in the wording", and the verdict on `grief-seating-shift` was MERGE
// INTO THIS ONE ("both are the missing person's place at the table"). The
// merge is honoured as a branch here; that event keeps its registration and is
// separately reforked below, on the standing reasoning.
//
// THE RECORD THE FORK READS is how many mornings this castle has already had
// one of these — `_lostSoFar` counts the empty chairs off the stored rounds —
// and the two of them's temperament. The first empty chair is stared at. The
// fourth one gets moved out of the way before breakfast, and that is a fact
// about the room rather than about anybody in it.
const EMPTY_CHAIR_LINES = {
  'empty-chair': [
    '{a} and {b} both ended up staring at the same empty seat at breakfast.',
    'Nobody moved {v}’s chair. {a} and {b} noticed at the same time that nobody had.',
    '{a} caught {b} looking at the gap at the table before either of them said anything.',
    'Somebody had laid the table for the number they had yesterday. {a} and {b} both counted the places.',
    '{b} pulled out {v}’s chair without thinking, realised, and put it back. {a} pretended not to have seen.',
    'There was too much room at the table now. {a} said so, badly, and {b} knew what they meant.',
    'The chair is exactly where {v} left it, pushed back at the angle {v} always pushed it back at.',
    '{a} and {b} sat either side of a gap and had a conversation across it about nothing at all.',
  ],
  'moved-it-away': [
    '{b} took {v}’s chair away from the table before anybody else came down, and {a} watched them do it.',
    'The chair went against the wall. Nobody asked who had moved it, and {a} knew, and said nothing.',
    '{a} stacked it, quite briskly, and {b} did not know whether to be grateful or appalled.',
    'By the time the room filled up there was no gap, because {b} had spent five minutes making sure of it.',
    '“It is easier if it is not there,” {b} said to {a}, and {a} could not argue with easier.',
    'Somebody had already dealt with it. That somebody was {b}, and {a} had seen the doing of it.',
    'The table now seats the number the castle actually has, which took {b} about a minute to arrange.',
    '{a} came down to a room with no hole in it and understood immediately what that had cost {b}.',
  ],
  'laid-a-place': [
    '{a} laid a place for {v} anyway, and {b} did not take it away.',
    'There was a cup at the empty setting all morning. {b} put it there and {a} let it stay.',
    '{a} counted out the plates and put down one too many, on purpose, and dared the room to say so.',
    'Nobody used {v}’s place. {a} and {b} kept it, without ever discussing keeping it.',
    'It is a small stubborn thing and {a} did it every morning that week.',
    '{b} moved a knife two inches so the setting was straight, which is not what people do to an empty chair.',
    'The castle ate around a laid place and pretended it had not noticed.',
    '{a} said it was for whoever comes next, which fooled nobody, including {a}.',
  ],
  'nobody-noticed': [
    'The table was laid for the right number this morning, first time, and only {a} and {b} clocked it.',
    'Somebody had already adjusted. {a} could not work out who, and that was worse than the gap.',
    'For the first time there was no gap to notice, and {a} noticed that instead.',
    'The room got the arithmetic right without being told, and {b} found that harder than the empty chair.',
    'Nobody counted this morning. {a} counted, and was the only one.',
    '{a} pointed the missing setting out to {b} and {b} said “I know,” in the voice of somebody who had stopped saying it.',
    'The castle has learned to lay a table for the survivors, and it learned it in about four days.',
    'Breakfast happened at the right speed for the wrong reason and only two people minded.',
  ],
};

registerEvent({
  id: 'grief-empty-chair',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'loyalty', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-empty-chair');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW MANY MORNINGS LIKE THIS THE CASTLE HAS ALREADY HAD, counted off the
    // stored rounds. Every branch below is about that number.
    const lost = (gs.tr?.rounds || []).filter(r => r.murdered || r.banished).length;
    const scores = {
      'empty-chair': Math.max(0.15, 0.6 - lost * 0.08),
      'moved-it-away': (sb.temperament / 10) * 0.3 + Math.min(4, lost) * 0.06,
      'laid-a-place': (sa.loyalty / 10) * 0.3,
      'nobody-noticed': Math.min(5, lost) * 0.09,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'empty-chair';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'moved-it-away' ? 'took the chair away before anyone came down'
      : branch === 'laid-a-place' ? 'laid a place for somebody who was not coming'
        : branch === 'nobody-noticed' ? 'the table was laid for the right number, first time'
          : 'the missing person’s place at the table';
    const note = lineFor(EMPTY_CHAIR_LINES[branch], `grief-empty-chair|${branch}|${ctx.ep}`, { a, b, v });
    const bondDelta = branch === 'nobody-noticed' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: t?.id, bondDelta };
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
    const out = { branch, actors, topic: v, topicKind: 'grief-loss', victim: v, remaining, threadId: t?.id, bondDelta };
    if (actors.length === 2) { out.pair = [actors[0], actors[1]]; }
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). MERGE-verdict event ("both are the missing
// person's place at the table"); the premise now also lives in
// `grief-empty-chair` as a branch, and this keeps its registration on the
// standing reasoning and earns it by forking on what `grief-empty-chair`
// cannot reach: the chair is one object, and the SEATING is the whole room
// rearranging itself around it. The record the fork reads is the stored bond
// between the two and how many mornings the castle has done this — the same
// counted number, because a room re-sorts itself faster every time.
const RESEATED_LINES = {
  reseated: [
    '{a} sat somewhere new this morning, and {b} sat down right next to them without being asked.',
    'Nobody sits where they sat on the first day any more. {a} moved again, and {b} moved with them.',
    '{a} took the chair furthest from the door and {b} took the one beside it, and neither explained.',
    'The table had reorganised itself overnight. {a} ended up next to {b}, and both of them were fine with that.',
    '{a} moved a seat along to close the gap, and {b} moved along after them.',
    'Two people who started the week at opposite ends of that table are now within arm’s reach of each other.',
    'It happens by inches and nobody announces it, and by day six the map is completely different.',
    '{b} arrived to find {a} had already saved the chair, which is not a thing anybody did on day one.',
  ],
  'kept-the-gap': [
    'The seats either side of the gap stayed empty. Nobody would take either of them.',
    '{a} moved rather than sit next to the space, and {b} moved for the same reason and would not say so.',
    'There is a hole in the middle of that table now and the castle eats around the edge of it.',
    'Two people shuffled up. Nobody closed it, and everybody noticed nobody had.',
    '{b} said it was silly. {b} still sat at the far end.',
    'The gap has become a place. {a} said that out loud and wished {a} had not.',
    'It would take one person moving one chair. Nobody in this castle is going to be that person.',
    '{a} and {b} both arrived early to make sure of a seat that was not that one.',
  ],
  'took-their-chair': [
    '{b} sat in {v}’s chair. Deliberately, first thing, in front of everybody.',
    'Somebody had to, and {b} decided it was going to be {b}, and let the room watch.',
    '{a} came down to find {b} in the dead person’s seat, eating toast, quite calmly.',
    '“It is a chair,” {b} said to {a}, which is true and is not what the room heard.',
    '{b} took the seat and held the room’s eye while doing it, which was the point of taking it.',
    'It is the best seat at that table and {b} has wanted it since Tuesday.',
    'The castle got its answer about {b} at about ten past eight this morning.',
    '{a} will remember which chair {b} chose long after {a} has forgotten what was said in it.',
  ],
  'sat-apart': [
    '{a} and {b} sat at opposite ends of the table this morning and neither of them planned it that way.',
    'Whatever the two of them had yesterday, the seating this morning did not reflect it.',
    '{b} took a chair three places from {a} and spent breakfast talking to somebody else.',
    'The room re-sorted itself and put {a} and {b} on different sides of it.',
    '{a} noticed where {b} sat and did the arithmetic, and did not like the answer.',
    'It is a small thing. In here a small thing is the only kind of thing there is.',
    'They have sat together every morning this week. This morning they did not.',
    '{a} kept a chair free and {b} did not take it, and both of them registered that.',
  ],
};

registerEvent({
  id: 'grief-seating-shift',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `grief|morning` held five events and
  // no advancer, the largest dead cell in the pool. Grief is cumulative by
  // nature — the second empty chair is only heavy because of the first — so
  // the citation is doing the work the family already implied.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['temperament', 'boldness', 'loyalty'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-seating-shift');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const lost = (gs.tr?.rounds || []).filter(r => r.murdered || r.banished).length;
    const scores = {
      reseated: 0.35 + Math.max(0, bond) * 0.07,
      'kept-the-gap': Math.max(0.1, 0.4 - lost * 0.06),
      'took-their-chair': (sb.boldness / 10) * 0.3 + Math.min(4, lost) * 0.04,
      'sat-apart': Math.max(0.05, 0.35 - Math.max(0, bond) * 0.06),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'reseated';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'kept-the-gap' ? 'nobody would take the seats either side of it'
      : branch === 'took-their-chair' ? 'sat in the dead person’s chair in front of everybody'
        : branch === 'sat-apart' ? 'sat at opposite ends of the table'
          : 'the seats moved around the gap';
    const note = lineFor(RESEATED_LINES[branch], `grief-seating-shift|${branch}|${ctx.ep}`, { a, b, v });
    const bondDelta = branch === 'reseated' ? 1
      : branch === 'kept-the-gap' ? 0.5
        : branch === 'took-their-chair' ? -1 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: b, respondent: a, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: thread?.id, cited, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`shared-mourning`) —
// the fork is in the wording." Two people mourning the same person is not one
// scene, because they did not have the same person: the record the fork reads
// is `getBond(a, v)` and `getBond(b, v)` — what each of them actually had with
// the person who is gone, stored, and accumulated over the whole season. A
// morning where both of them lost somebody and a morning where one of them
// lost somebody and the other is being kind are different mornings, and until
// this rewrite the castle could only print the first.
const SHARED_MOURNING_LINES = {
  'shared-mourning': [
    '{a} and {b} didn’t talk much this morning. They didn’t need to.',
    '{a} sat down next to {b} and stayed there, and that was the entire conversation.',
    'Whatever {a} and {b} had before this morning, it was heavier by lunchtime and neither of them mentioned it.',
    '{b} made two cups of tea without asking, and {a} took one, and that was enough.',
    'They did the washing up together, {a} and {b}, very slowly, for much longer than it took.',
    'Both of them lost the same person and neither of them said the name once all morning.',
    '{a} and {b} sat on the step for an hour with about four sentences between them.',
    'It is the only conversation in this castle this week where nobody was working anything out.',
  ],
  'told-a-story-about-them': [
    '{b} told {a} the thing {v} had said on the second night, and both of them laughed and then stopped.',
    '{a} and {b} spent breakfast on {v} — not the death, {v} — and it was the best half-hour of the week.',
    'They swapped {v} stories until somebody else came in, and then they stopped.',
    '{b} did the voice. {a} had not expected to laugh at anything today and did.',
    '“{v} would have hated this,” said {a}, about the whole morning, and {b} agreed at length.',
    'It turned out {a} and {b} had two completely different versions of {v}, and both of them were true.',
    '{b} remembered something {a} had forgotten, and {a} was very glad somebody else had it.',
    'For twenty minutes {v} was a person in that room rather than a chair.',
  ],
  'one-sided-grief': [
    '{a} was in pieces. {b} had barely known {v}, and spent the morning being careful about that.',
    '{b} said the right things and did not feel any of them, and hoped {a} could not tell.',
    'It is hard to mourn beside somebody who is mourning much harder, and {b} found that out this morning.',
    '{a} kept saying “you understand,” and {b} kept saying yes.',
    '{b} lost an acquaintance. {a} lost the one person in here who knew them, and the gap between those showed.',
    '{a} needed somebody to have loved {v} too. {b} was the person available rather than the person needed.',
    '{b} was kind about it all morning and got it slightly wrong in about four places.',
    'By lunch {a} had stopped talking about {v} to {b}. {b} noticed but did not ask why.',
  ],
  'could-not-say-it': [
    'Neither of them could get through a sentence about {v}, so they stopped starting them.',
    '{a} tried three times and {b} did not make {a} finish any of them.',
    'They sat with it and did not name it, and both would have said afterwards it helped.',
    '{b} started to say something about the last night and then simply did not.',
    'It went unspoken for two hours, and the unspokenness was the whole of what passed between them.',
    '{a} opened their mouth twice and shut it twice and {b} nodded both times.',
    'Whatever either of them has to say about {v}, this was not the morning it was going to get said.',
    'They washed up in silence and neither of them left the room first.',
  ],
};

registerEvent({
  id: 'grief-shared-mourning-bond',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous'],
    voice: ['loyalty', 'social', 'temperament'],
    relationship: ['close-ally', 'neutral'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (!_victimLastNight(ctx.ep)) return 0;
    return getBond(a, b) >= 3 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-shared-mourning-bond');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    // WHAT EACH OF THEM ACTUALLY HAD WITH THE PERSON WHO IS GONE. Stored, and
    // accumulated across the whole season; this is the fork.
    const av = v ? getBond(a, v) : 0;
    const bv = v ? getBond(b, v) : 0;
    const both = Math.min(av, bv);
    const gap = Math.abs(av - bv);
    const sb = pStats(b);
    const scores = {
      'shared-mourning': 0.3 + Math.max(0, both) * 0.09,
      'told-a-story-about-them': Math.max(0, both) * 0.07 + (sb.social / 10) * 0.25,
      'one-sided-grief': Math.max(0, gap) * 0.11,
      'could-not-say-it': (1 - sb.social / 10) * 0.3 + Math.max(0, both) * 0.04,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'shared-mourning';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'told-a-story-about-them' ? 'made the dead a person for half an hour'
      : branch === 'one-sided-grief' ? 'mourned beside somebody who had barely known them'
        : branch === 'could-not-say-it' ? 'could not get through a sentence about them'
          : 'mourned the same person together';
    const note = lineFor(SHARED_MOURNING_LINES[branch],
      `grief-shared-mourning-bond|${branch}|${ctx.ep}`, { a, b, v: v || b });
    const bondDelta = branch === 'one-sided-grief' ? 0.5
      : branch === 'told-a-story-about-them' ? 2.5 : 2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: t?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`timing`) — the fork is
// in the wording, not in the game; no thread write, so no reachable follow-up
// and no terminal outcome." The thread write arrived in stage 2. The fork is
// here, and the record it reads is the story the castle was already telling
// about {v} — an open `suspicion` arc naming the person who was taken, which
// is a thing the whole room watched being built. "Why them, why now" has an
// entirely different answer depending on whether the castle had spent three
// days deciding {v} was a Traitor.
const TIMING_LINES = {
  timing: [
    '{a} said to {b}, quietly: “of everyone, why {v}, and why last night?” Neither of them had an answer.',
    '“Why {v},” {a} kept saying to {b}, “and why now.” It was not really a question by the fourth time.',
    '{a} wanted to know what {v} knew. {b} wanted to know who else had wondered that before last night.',
    'Of everybody in the castle, {v}. {a} could not make it fit, and {b} had been trying for an hour longer.',
    '{a} asked {b} what {v} had done to deserve going first, and got a silence that was itself an answer.',
    'There are nineteen people in this building and one of them is gone, and {a} wants to know why that one.',
    '{b} said it was random. {a} said nothing in here is random, and {b} did not really disagree.',
    'The two of them went round it four times and arrived back where they started, which was {v}.',
  ],
  'about-to-say-something': [
    '{b} pointed out to {a} that {v} had been about to say something at that table. Neither of them liked where that went.',
    '{v} had started a sentence last night and not finished it, and {a} has been thinking about the half of it that got said.',
    '“{v} was going to name somebody,” {a} said, and once said it could not be unsaid.',
    '{b} remembered exactly what {v} had been holding, and told {a}, and both of them went quiet.',
    'Somebody stopped {v} talking. {a} said that out loud to {b} and meant it literally.',
    '{a} and {b} worked out between them what {v} had been building towards, and worked out what it cost.',
    'The last thing {v} said was a beginning. {b} has not been able to think about anything else.',
    '“It was the question,” said {b}. “It was because of the question.”',
  ],
  'we-had-it-wrong': [
    '{a} and {b} had spent three days on {v}, and last night settled it in the worst possible direction.',
    'The castle had a story about {v}. That story is now unavailable and {a} would like the last three days back.',
    '{b} pointed out, gently, that they had been asking {v} questions right up until Tuesday.',
    '“We were wrong,” said {a}, which is a bigger sentence than it sounds in here.',
    'All of it pointed at {v} and all of it was pointing the wrong way, and {a} and {b} were both pointing.',
    'The one thing {a} and {b} had agreed on all week has just been disproved by somebody with a knife.',
    '{b} said they should start again from the beginning. {a} said the beginning was {v}.',
    'What {a} and {b} lost last night was not only {v}. It was every hour they spent on {v}.',
  ],
  'would-not-play': [
    '{a} started on why-{v}-and-why-now, and {b} said, flatly, that {b} was not doing this today.',
    '“Somebody is dead,” {b} said, “and you want to do arithmetic,” and {a} had no answer for that.',
    '{b} refused the whole shape of the conversation and left {a} holding it.',
    '{a} wanted to solve it. {b} wanted to be sad about it for one morning, and said so.',
    '“Not everything is a clue,” said {b}, which is either true or the most useful thing a Traitor ever says.',
    '{b} would not speculate about {v} at all, which {a} noticed and filed and did not mention.',
    '{a} asked the question twice and got the same non-answer twice.',
    '{b} walked out on the conversation, politely, in the middle of {a}’s second sentence.',
  ],
};

registerEvent({
  id: 'grief-suspicion-of-timing',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `grief|morning`. "Why last night" is a question
  // that gets sharper every time it is asked, and the citation is what makes
  // the second asking sound different from the first.
  citesResidue: true,
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-suspicion-of-timing');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sa = pStats(a);
    const sb = pStats(b);
    // WHAT THE CASTLE WAS ALREADY SAYING ABOUT {v}, off the stored threads.
    // A suspicion story naming the person who was taken is the whole of the
    // `we-had-it-wrong` branch, and it is looked up rather than asserted.
    const wasSuspected = (gs.tr?.threads || [])
      .some(t => t.kind === 'suspicion' && v && t.parties.includes(v));
    const scores = {
      timing: 0.45,
      'about-to-say-something': (sa.intuition / 10) * 0.35,
      'we-had-it-wrong': wasSuspected ? 0.4 + (sa.loyalty / 10) * 0.15 : 0,
      'would-not-play': (sb.temperament / 10) * 0.25 + (1 - sb.strategic / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'timing';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'about-to-say-something' ? 'read the death as a sentence somebody stopped'
      : branch === 'we-had-it-wrong' ? 'lost three days of being wrong about the same person'
        : branch === 'would-not-play' ? 'refused to do arithmetic on a morning like this'
          : 'read something into who was taken and when';
    const note = lineFor(TIMING_LINES[branch], `grief-suspicion-of-timing|${branch}|${ctx.ep}`,
      { a, b, v: v || b });
    const bondDelta = branch === 'would-not-play' ? -1 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: thread?.id, cited, bondDelta };
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
    '{a} cried in front of {b} without apologising for it, which nobody here does.',
    '{a} said {v}’s name about nine times in half an hour and did not notice doing it.',
    '{b} asked how {a} was and got an honest answer, at length, for the first time this week.',
    '{a} wanted to talk about {v} and not about who did it, and said so.',
    'It took {a} most of the morning and {b} sat through the whole of it.',
    '{a} went and stood in the room where {v} used to leave their boots.',
    '{a} said the name once at breakfast and then could not say anything else.',
    '{a} kept the seat next to them empty for the whole of the morning.',
    'There is a right amount to grieve a stranger and {a} has gone past it.',
    '{a} was fine until somebody passed the toast the way {v} used to.',
    '{a} took it worse than the room expected and did not perform any of it.',
    '{a} said the eulogy nobody asked for, quietly, into a cup of tea.',
    '{a} has known {v} for six days and is behaving like it was six years.',
    '{a} stayed at the table long after it had emptied.',
    '{a} was the last one to look away from the portrait.',
  ],
  suspicious: [
    '{a} skipped past the grief entirely and went straight to "who benefits from this?" {b} didn\'t have a good answer.',
    '{a} was already building a theory before breakfast was over, and said as much to {b}.',
    'Before anybody had said {v}\'s name twice, {a} was asking {b} who had been out of their room.',
    '{a} wanted the timeline, not the eulogy, and made {b} walk through the whole evening with them.',
    '{a} was asking who had been where before the announcement had finished.',
    '“Who benefits,” said {a}, to {b}, over the toast, which is not a breakfast sentence.',
    '{a} had a list of names before {a} had a cup of tea.',
    '{b} wanted to be sad about it. {a} wanted the hour it happened in.',
    '{a} skipped grief entirely and went straight to arithmetic, and did not pretend otherwise.',
    '{a} was doing the arithmetic before the room had finished reacting.',
    '{a} wanted to know who had gone up the stairs and when, and asked twice.',
    '{a} looked at faces rather than at the empty chair.',
    'The grief in that room was real and {a} was reading it for tells.',
    '{a} counted who cried and, more usefully, who cried second.',
    '{a} has three names by the end of breakfast and had none at the start.',
    '{a} did not ask how anybody was feeling. {a} asked where they had been.',
    '{a} treated the announcement as evidence rather than as news.',
  ],
  stoic: [
    '{a} said almost nothing all morning. {b} noticed, and let them have it.',
    '{a} went quiet in a way that read as more, not less.',
    '{a} ate breakfast, cleared the plate, and answered every question with one word.',
    'Whatever {a} was doing with it, they were doing it somewhere nobody could watch.',
    '{a} was up before anybody, dressed, useful, and completely unreachable.',
    '{a} did the washing up. All of it. Twice. And said about four words.',
    'Nothing showed. {b} watched for it all morning and nothing showed.',
    '{a} answered every question with the shortest true answer available.',
    '{a} has a way of being present and entirely absent at once, and did it all morning.',
    '{b} could not tell whether {a} was devastated or unbothered, and neither could {a}.',
    '{a} was already dressed and already useful before the room had woken up.',
    '{a} put the chairs back, straightened the table, and said nothing at all.',
  ],
  opportunistic: [
    '{a} used the room\'s grief to steer {b} toward exactly where {a} wanted the suspicion to land — smoothly enough that {b} never felt managed.',
    '{a} tried to use the moment to move {b} where they wanted, and it came out clumsy enough that {b} half-noticed something was off.',
    '{a} grieved convincingly for {v} and, in the same breath, put a name in {b}\'s head that had not been there at breakfast.',
    '{a} was a fraction too keen to comfort {b}, and a fraction too keen to tell them who to look at, and {b} clocked the second part.',
    '{a} was the first person at {b}’s side and the first person to say a name.',
    'The comfort was real enough. The name that came after it was the reason for the comfort.',
    '{a} used the worst morning of {b}’s week to move {b} one place along.',
    '{a} said “we have to think about who gains,” which is true and was not what {b} needed.',
    'It was decent and it was working, and {b} will remember which came first.',
    '{a} was sorry, loudly, and then helpful, pointedly, in that order.',
    '{a} grieved for exactly as long as it took the room to start listening.',
    'There is a way to be the most comforting person in a room and to be steering it, and {a} did both.',
    '{a} said a name inside a condolence, which is a difficult thing to object to.',
    '{a} put an arm round somebody and a thought in their head at the same time.',
    '{a} made sure to be visible this morning, and to be visible being kind.',
    'The tears were real. The timing was not an accident.',
    '{a} used the worst hour of the week to become somebody people go to.',
  ],
};

registerEvent({
  id: 'grief-morning-reaction',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['boldness', 'intuition', 'loyalty', 'social', 'strategic'],
  },
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

    return { branch, reactor, partner, topic: victim, topicKind: 'grief-loss', victim, isTraitor, archetype, threadId, bondDelta };
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
    const out = { branch, actor, topic: v, topicKind: 'grief-loss', victim: v, threadId: t?.id, bondDelta };
    if (branch === 'handed-it-over') { out.pair = [actor, keeper]; out.speaker = actor; out.respondent = keeper; }
    if (branch === 'set-it-out') out.crowd = { name: actor, colour: 'kind', mult: 0.4 };
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`blamed-room`) — the
// fork is in the wording." Anger said out loud to a room is the loudest thing
// this family does and it had one outcome, which is that it always landed the
// same way. The record the fork reads is `ctx.state` — what the last Round
// Table did to {a}, which the whole castle watched — plus both temperaments,
// and the fork is what the anger turns into: an accusation with a number in
// it, a fight with the one person standing there, or a thing {a} turns inward.
const BLAME_ROOM_LINES = {
  'blamed-room': [
    '{a} said out loud that somebody in this castle let {v} die. {b} didn’t disagree.',
    '“One of us sat at that table last night and knew,” {a} said, to the room, and {b} watched who looked up.',
    '{a} was not grieving so much as furious, and {b} caught the edge of it.',
    '{b} said it was nobody’s fault. {a} said that was exactly the problem, and the room heard both.',
    '{a} pointed out that {v} had been sitting between two people last night, and neither of them was going to say who.',
    '{a} addressed the whole hall for about ninety seconds and did not lower their voice once.',
    '“Somebody in this room said goodnight to {v},” said {a}. Nobody put a hand up.',
    'It was not aimed at anybody, which is why everybody in the hall took it personally.',
  ],
  'named-a-number': [
    '“Three of you know exactly what happened,” {a} said, and the number was the frightening part.',
    '{a} counted, out loud, how many people it would have taken, and got to a number nobody liked.',
    '{a} did the arithmetic in front of the room: {v} was not taken by weather.',
    '“There are more of them than you think,” {a} said to the hall, and could not be talked down from it.',
    '{a} put a figure on it and the figure did more damage than the accusation.',
    '{b} tried to soften it. {a} repeated the number instead.',
    'What {a} said was structural rather than personal, and the room found that much worse.',
    'By the end of it half the castle was checking {a}’s arithmetic and the other half was checking each other.',
  ],
  'turned-on-them': [
    '{a} started by blaming the room and finished by blaming {b}, and never noticed the turn.',
    'It was general for about a minute and then it was very specifically about {b}.',
    '“You were the last one up,” {a} said to {b}, which was true and was not the same as an accusation.',
    '{b} was standing there and the anger had to go somewhere, and it went at {b}.',
    '{a} did not mean it. {a} said it, and the room was there, and it cannot be unsaid.',
    'The room got a speech and {b} got the end of it, at close range.',
    '{b} answered calmly, which made {a} angrier rather than less.',
    'What began as grief for {v} became a thing between {a} and {b} inside four sentences.',
  ],
  'blamed-themselves': [
    '{a} said the room let {v} die, and then said that {a} was the room.',
    '“I was awake,” said {a}. “I heard something. I went back to sleep.”',
    'The anger turned round on {a} halfway through and {b} did not know what to do with the second half.',
    '{a} had promised {v} something on Tuesday and told the whole hall about it this morning.',
    '{b} said it was not {a}’s fault, four times, and {a} did not accept any of them.',
    'What {a} could not forgive was not the castle. {b} understood that about a minute too late.',
    '{a} apologised to a chair, in front of eleven people, and then left the room.',
    'It is the most honest thing anybody has said in that hall all week and nobody knew where to look.',
  ],
};

registerEvent({
  id: 'grief-blame-the-room',
  family: FAMILY,
  window: 'morning',
  variationAxes: {
    outcome: ['backfire', 'ambiguous', 'rejected'],
    voice: ['temperament', 'boldness', 'loyalty'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-blame-the-room');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sa = pStats(a);
    // WHAT THE LAST TABLE LEFT {a} WITH, read off the frozen round record.
    const rattled = isNervy(ctx.state?.[a]);
    const withVictim = v ? getBond(a, v) : 0;
    const scores = {
      'blamed-room': 0.4 + (rattled ? 0.2 : 0),
      'named-a-number': (sa.strategic / 10) * 0.3 + (sa.boldness / 10) * 0.2,
      'turned-on-them': (1 - sa.temperament / 10) * 0.35 + (rattled ? 0.15 : 0),
      'blamed-themselves': (sa.loyalty / 10) * 0.25 + Math.max(0, withVictim) * 0.07,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'blamed-room';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-a-number' ? 'put a figure on how many of them knew'
      : branch === 'turned-on-them' ? 'blamed the room and finished by blaming one person'
        : branch === 'blamed-themselves' ? 'decided they were the room'
          : 'blamed the room out loud for the death';
    const note = lineFor(BLAME_ROOM_LINES[branch], `grief-blame-the-room|${branch}|${ctx.ep}`,
      { a, b, v: v || b });
    const bondDelta = branch === 'turned-on-them' ? -2
      : branch === 'blamed-themselves' ? 1 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    const out = { branch, pair: [a, b], topic: v, topicKind: 'grief-loss', victim: v, threadId: t?.id, bondDelta };
    // {a} is the one talking on every branch; on `blamed-themselves` there is
    // nobody being leaned on at all, and the record says so by naming the
    // speaker without a respondent, which `sceneSpeakers` rejects into the
    // screen's own fallback rather than asserting a direction that is not there.
    if (branch !== 'blamed-themselves') { out.speaker = a; out.respondent = b; }
    return out;
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
    '{a} poured two and drank one and left the other where it was until morning.',
    'It took about four seconds and {a} did it every night that week.',
    '{a} said the name once, quietly, in a kitchen with nobody in it.',
    'There is a glass on that windowsill and only one person in this castle knows why.',
    '{a} raised it to a chair, felt ridiculous, and did it anyway.',
    'Nobody joined in because nobody was invited and nobody was told.',
    '{a} has done this for two of them now and is not looking forward to a third.',
    'It is the only part of the day {a} does not have to perform any of.',
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
      return { branch: 'poured-two', topic: gone, topicKind: 'grief-loss', actor: a, gone, threadId: solo.thread?.id,
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
    return { branch, pair: [a, b], topic: gone, topicKind: 'grief-loss', gone, threadId: thread?.id, cited, bondDelta,
      crowd: [{ name: a, colour: 'kind', mult: 0.5 }, { name: b, colour: 'kind', mult: 0.5 }] };
  },
});

// ONCE PER SEASON, so it never repeats WITHIN a castle — but a reader who
// watches four seasons meets it four times, and it read identically all four.
// Every line here still asserts the ROOM crossed the threshold, which is the
// claim `oncePerSeason` is defending; see the long note on the flag below.
// ── REWRITE (Task 7 stage 6). MERGE-verdict event ("numbness is a fifth
// reaction to the morning, alongside mourn/suspicious/stoic/opportunistic"),
// kept on the standing reasoning and forked here on the one axis
// `grief-morning-reaction` cannot reach: this event is not about a person's
// reaction, it is about the ROOM'S THRESHOLD, and a threshold has more than
// one way of being crossed. The record it reads is `murderCount(gs)` — which
// the weight already requires to be at least two — and whether the two people
// standing there have crossed it at the same time. They usually have not, and
// that is the scene.
const NUMB_LINES = {
  numb: [
    'The castle had stopped flinching at the empty chair. {a} said so out loud to {b}, and hated that nobody argued.',
    'Nobody looked up when the number changed this morning. {a} pointed that out to {b}, and the room let it stand.',
    'Breakfast happened at the normal speed today. {a} said to {b} that it should not have, and {b} had no answer to that.',
    'Somewhere in the last few days the castle had started treating this as weather. {a} named it to {b}; nobody in earshot disagreed.',
    'The room had got good at this. {a} said the words to {b} and hated every one of them, and still nobody argued.',
    'The announcement took forty seconds and then people asked about the bread. {a} said so to {b}; nobody in the hall looked up.',
    'There was no gasp this morning. {a} told {b} that there used to be one, and the room let that stand too.',
    'The castle has a routine for this now. {a} described the routine to {b}, out loud, and nobody contradicted a word of it.',
  ],
  'one-of-them-still-feels-it': [
    'The room had stopped flinching. {b} had not, and {a} watched {b} be the only one.',
    '{a} said the castle was used to it now. {b} said “I am not,” and the hall heard that too.',
    'Everybody got on with breakfast. {b} did not, and {a} said out loud that somebody had to not.',
    'The castle crossed a line this morning and {b} was standing on the other side of it, alone.',
    '{a} told {b} that nobody flinches any more. {b} flinched, then, which proved and disproved it at once.',
    'It is a room of people who have adjusted, and one person who refuses to, and {a} named both.',
    '{b} is still counting. {a} said to the hall that {b} was the last one who was, and was not contradicted.',
    'The difference between them this morning is that one of them still finds it remarkable.',
  ],
  'said-it-and-regretted-it': [
    '{a} said the castle had got used to death, heard it land, and could not take it back.',
    'It came out as an accusation against everybody in the hall, including {a}, and {a} had not meant that.',
    '{a} named the thing nobody names and then had to stand in the room afterwards.',
    '“That was not fair,” {b} said, later, and {a} agreed and still thought it was true.',
    'The sentence was accurate and unkind in about equal measure, and the room only heard the second half.',
    '{a} apologised for the way it was said and not for any of what was in it.',
    'Two people stopped speaking to {a} over it, which is a lot of people in a castle this size.',
    '{a} will be quoted on it at the next table, and knew that about four seconds too late.',
  ],
  'performed-it': [
    'The castle did the mourning the way you do a fire drill, and {a} said so to {b} in the middle of it.',
    'Everybody said the right thing in the right order, and {a} pointed out to {b} that it had an order now.',
    'The hall observed a silence that had been getting shorter all week, and {b} timed it.',
    '{a} told {b} that the castle has a ceremony for this and nobody can remember agreeing to one.',
    'They all said the name. Nobody said anything else, and {a} named the difference out loud.',
    'It has become a routine with parts in it, and {a} described the parts to {b} while they were happening.',
    'The room grieved competently, which {a} said to {b} is the worst sentence available.',
    '{b} said it was better than nothing. {a} said that was exactly what it was better than.',
  ],
};

registerEvent({
  id: 'grief-numb-to-it-now',
  family: FAMILY,
  window: 'dawn',
  acts: { late: 2 },
  variationAxes: {
    outcome: ['ambiguous', 'backfire', 'rejected'],
    voice: ['temperament', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
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
  //
  // AND ALL FOUR BRANCHES BELOW ARE STILL ABOUT THE ROOM, deliberately, so the
  // flag keeps meaning what this note says it means. `one-of-them-still-feels-
  // it` is not "{b} is sad" — it is the castle having crossed the line with
  // one person left on the other side of it, which is still a claim about the
  // castle and is still a thing that can only become true once.
  oncePerSeason: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const deaths = murderCount(gs);
    return deaths >= 2 && _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-numb-to-it-now');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sa = pStats(a);
    const sb = pStats(b);
    const deaths = murderCount(gs);
    const scores = {
      numb: 0.35 + Math.min(4, deaths) * 0.05,
      'one-of-them-still-feels-it': (1 - sb.temperament / 10) * 0.3 + (sb.loyalty / 10) * 0.2,
      'said-it-and-regretted-it': (sa.boldness / 10) * 0.25 + (1 - sa.temperament / 10) * 0.2,
      'performed-it': (sa.intuition / 10) * 0.25 + Math.min(5, deaths) * 0.04,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'numb';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'one-of-them-still-feels-it' ? 'was the last person in the hall still counting'
      : branch === 'said-it-and-regretted-it' ? 'named the thing nobody names and had to stand there afterwards'
        : branch === 'performed-it' ? 'watched the castle grieve competently'
          : 'stopped feeling the mornings';
    const note = lineFor(NUMB_LINES[branch], `grief-numb-to-it-now|${branch}|${ctx.ep}`, { a, b });
    // NO BOND MOVE ON `numb`, deliberately — the point of that one IS the
    // absence of a felt reaction, and that was true of the event before this
    // rewrite. The other three are scenes with something in them and move it.
    const bondDelta = branch === 'numb' ? 0
      : branch === 'one-of-them-still-feels-it' ? 1
        : branch === 'said-it-and-regretted-it' ? -1 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: t?.id, bondDelta };
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
    // C3: THE SAME DEFECT, HARDCODED. Both clauses cite the last Round Table,
    // and `came-down-angry` below SETS `paranoid` through `setEmotionalState`
    // — so this event can cause the mood it then reads and narrate a ballot
    // that never existed. The clause is now gated on the record naming this
    // person, exactly as `after-you-wrote-my-name` gates its own.
    const behind = isNervy(state) ? _ballotBehind(actor) : null;
    const why = !behind ? ''
      : state === 'desperate'
        ? ` It was not really about the empty chair; ${actor} had watched the room write their own name down and was still counting.`
        : ` Somebody had said ${actor}'s name at that table, and it had not stopped ringing since.`;
    const line = lineFor(CRIES_ALONE_LINES[branch],
      `grief-someone-cries-alone|${branch}|${ctx.ep}|${state || 'content'}`,
      { a: actor, c: finder || 'somebody' });
    const parties = branch === 'was-found' ? [actor, finder] : [actor];
    const t = api.openArc(FAMILY, parties, { source: sceneWhy, seed: `${line}${why}` });
    const out = { branch, actor, threadId: t?.id, state: state || 'content', bondDelta: 0 };
    // GROUNDED (once-skipped). The empty chair is a MURDER victim (the grief
    // gate requires one), so the death-vs-banishment axis is always 'death'
    // here. topic is the dead when the scene mourns them, and the actor
    // themself when the scene is really about their OWN name at the last table
    // (came-down-angry off a ballot) — the mixed subject that got this event
    // skipped. See grief-vigil in vp-tr/castle-day.js.
    const victim = _victimLastNight(ctx.ep);
    const tableDriven = branch === 'came-down-angry' && !!behind;
    out.topicKind = 'grief-vigil';
    // came-down-angry off a real ballot is about the actor's OWN name (haunted);
    // was-found is a comfort scene, closed on the shared loss with a role-neutral
    // pool (naming the dead against BOTH of them, so the recorded pair need not
    // be reordered — reordering it shifts the castle scene stream); everything
    // else mourns the dead.
    out.topicDir = tableDriven ? 'haunted' : branch === 'was-found' ? 'comforted' : 'mourned';
    out.topic = tableDriven ? actor : victim;
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
// ── REWRITE (Task 7 stage 6). The audit: "one branch — the fork is in the
// wording." The premise is the best irony the format has and it had exactly
// one reaction to it. The record the fork reads is the suspicion arc naming
// {v} — which the weight already requires to exist — and specifically WHO IS
// ON IT: an arc {a} is a party to is a thing {a} did, and an arc {a} merely
// watched is a thing the room did, and those are two different mornings. Both
// are looked up off `t.parties`, never assumed.
const WRONGLY_SUSPECTED_LINES = {
  'wrongly-suspected-irony': [
    '{a} and {b} realised, too late, that {v} had spent their last days under a suspicion that never actually went anywhere.',
    'Whatever {a} and {b} had thought about {v} last week, they were not going to get to find out now.',
    '{b} reminded {a} what they had both been saying about {v} three days ago. Neither of them enjoyed the reminder.',
    '{v} had been answering questions right up until the end, and {a} and {b} worked out this morning that none of them had mattered.',
    'The case against {v} died with {v}, and {a} and {b} were the only two still holding it.',
    'Four days of watching {v} very carefully, and the one thing they were watching for was never there.',
    '{a} said {v}’s name this morning in a completely different voice from the one used on Tuesday.',
    'Everything {a} and {b} had about {v} turned out to be about somebody they were never going to find this way.',
  ],
  'owned-the-mistake': [
    '{a} said it out loud: “I had {v}. I was completely wrong about {v}, in front of everybody.”',
    '{a} apologised to a room for something the room had also done, and was the only one who did.',
    '“I asked {v} four times where they were on Tuesday,” said {a}. “Four times.”',
    '{a} took the whole of it and did not spread any of it round the table.',
    '{b} tried to share the blame and {a} would not let {b} have any.',
    'It cost {a} something to say and {a} said it before breakfast was over.',
    '{a} has been wrong about somebody before and has never had it settled like this.',
    'What {a} said this morning will be remembered longer than anything {a} said about {v} alive.',
  ],
  'still-think-we-were-right': [
    '{a} pointed out that being taken does not clear anybody of anything, and {b} did not enjoy hearing it.',
    '“They could still have been one,” said {a}, about {v}, on the morning of it, and meant it.',
    '{b} said {v} was innocent. {a} said {b} had no more evidence for that today than yesterday.',
    'The suspicion did not die with {v} — {a} carried it out of the room intact.',
    '{a} has seen a castle kill its own before now and is not giving the last four days up.',
    '“Prove it,” said {a}, which is a terrible thing to say about somebody who cannot answer.',
    '{b} thought that was monstrous and said so, and {a} agreed and did not change position.',
    'It is the coldest thing said in that hall this week and it is not obviously wrong.',
  ],
  'turned-on-each-other': [
    '{a} said {b} had started it. {b} said {a} had, and both of them were partly right.',
    'The case against {v} had two authors and this morning each of them named the other one.',
    '“You said it first,” said {a}, which is true and is not the defence {a} thinks it is.',
    'Whatever {a} and {b} had built about {v} came apart this morning and took the two of them with it.',
    '{b} pointed out exactly which conversation had started it and who had been in it.',
    'It was a shared mistake right up until it was a mistake, and then it was {b}’s.',
    'Two people who agreed about {v} for four days spent this morning proving they never had.',
    '{a} and {b} will not be doing this together again, and both of them said so.',
  ],
};

registerEvent({
  id: 'grief-wrongly-suspected-irony',
  family: FAMILY,
  window: 'morning',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected', 'backfire'],
    voice: ['loyalty', 'temperament', 'strategic'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const v = _victimLastNight(ctx.ep);
    if (!v) return 0;
    const threads = gs.tr?.threads || [];
    // 2 -> 3, and the reason is the POOL rather than this event. The gate is a
    // real coincidence -- somebody murdered last night who was ALSO carrying an
    // open suspicion thread -- so it was never going to fire often, and at
    // weight 2 it now loses draws it used to win simply because the castle pool
    // has grown around it. `turned-on-each-other` fell to 33 firings against
    // the 40 the variety floor needs to be a measurement rather than a coin
    // flip. FIRST bump, on an untouched weight; if it needs a second one the
    // answer is the gate, not the dial.
    return threads.some(t => t.kind === 'suspicion' && t.parties.includes(v)) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-wrongly-suspected-irony');
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const sa = pStats(a);
    // WHOSE CASE IT WAS, off the stored arc's own parties. An arc {a} is a
    // party to is a thing {a} did; one {a} only watched is a thing the room
    // did. The weight has already established at least one such arc exists.
    const arcs = (gs.tr?.threads || [])
      .filter(t => t.kind === 'suspicion' && v && t.parties.includes(v));
    const theirs = arcs.some(t => t.parties.includes(a));
    // STRUCTURALLY IMPOSSIBLE AS WRITTEN, and it scored a literal 0 on every
    // firing across a 3200-season sweep -- a quarter of this event's written
    // content that had never reached a screen. `arcs` is already filtered to
    // threads naming the victim, and a thread is opened with ONE or TWO
    // parties (see js/tr/castle/suspicion.js), so no single arc can hold the
    // victim AND both of these actors. What the branch MEANS is that both of
    // them had a case against the person who is now dead, and that is two
    // arcs rather than one.
    const shared = arcs.some(t => t.parties.includes(a))
      && arcs.some(t => t.parties.includes(b));
    const scores = {
      'wrongly-suspected-irony': 0.4,
      'owned-the-mistake': theirs ? (sa.loyalty / 10) * 0.35 + 0.15 : 0,
      'still-think-we-were-right': (sa.strategic / 10) * 0.3 + (1 - sa.loyalty / 10) * 0.2,
      'turned-on-each-other': shared ? 0.25 + (1 - sa.temperament / 10) * 0.25 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'wrongly-suspected-irony';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'owned-the-mistake' ? 'said out loud that they had been wrong about the dead'
      : branch === 'still-think-we-were-right' ? 'would not clear the dead of anything'
        : branch === 'turned-on-each-other' ? 'argued about whose case it had been'
          : 'had suspected the person who was killed';
    const note = lineFor(WRONGLY_SUSPECTED_LINES[branch],
      `grief-wrongly-suspected-irony|${branch}|${ctx.ep}`, { a, b, v: v || b });
    const bondDelta = branch === 'owned-the-mistake' ? 2
      : branch === 'still-think-we-were-right' ? -1
        : branch === 'turned-on-each-other' ? -2 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: v, topicKind: 'grief-loss', victim: v,
      threadId: t?.id, bondDelta };
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
  // THE SAME NIGHT WITH NO BALLOT UNDER IT (fix round 1, C3). Reachable only
  // when the mood came from somewhere other than the room's votes — an
  // override written by a scene, or an episode with no table behind it yet.
  // Not one of these says anybody voted, said a name, or sat at a table,
  // because on this branch the record does not say that they did.
  unfounded: [
    '{a} could not name a single thing that had gone wrong today and lay awake about it anyway.',
    'Nothing happened. {a} spent four hours going over the nothing.',
    '{a} kept coming back to who had looked away first, and could not let the question go long enough to sleep.',
    'Every creak in the building was somebody deciding something about {a}, and {a} knew that was nonsense, and lay there anyway.',
    '{a} counted who had been kind to them today and could not decide what any of it had meant.',
    'Somewhere in the dark {a} started ranking the room by who had not looked at them, which is no way to sleep.',
    'It is a feeling rather than a fact, and at three in the morning {a} could not tell the difference.',
    '{a} listened to the corridor for a long time and could not decide whether it had gone quiet or always was.',
    '{a} rehearsed a conversation nobody has asked for, twice, and then a third time.',
    'There is no evidence for any of it. {a} lay there assembling some.',
    '{a} went under twice and came back up both times with the same face in front of them.',
    'By four {a} had built a whole case out of an afternoon and could not find the first brick of it.',
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
    '{a} lay there doing arithmetic on a room that keeps getting smaller.',
    'The castle at four in the morning is a very long building, and {a} heard all of it.',
    '{a} slept for perhaps an hour and dreamed about the table, which was not restful.',
    'There is nothing to do at that hour except think, and {a} thought about all of them in order.',
    '{a} got up twice for water neither time wanting water.',
    'It was light before {a} stopped listening to the corridor.',
  ],
};

registerEvent({
  id: 'grief-nobody-sleeps',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['temperament', 'loyalty', 'intuition'],
  },
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
    // C3: A NERVY MOOD IS NOT A BALLOT. Three of the `paranoid` lines and both
    // of the `desperate` ones cite the table; they are reachable only when the
    // record names this person on it. See `_ballotBehind` above.
    const grounded = !isNervy(state) || !!_ballotBehind(actor);
    const pool = grounded ? state : 'unfounded';
    const line = pick(rng, NIGHT_AWAKE_LINES[pool] || NIGHT_AWAKE_LINES.content)
      .replace(/\{a\}/g, actor);
    const tail = gone === 1 ? 'One empty bed, so far.' : `${gone} empty beds, so far.`;
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: `${line} ${tail}` });
    // THE BRANCH IS THE STATE. Returning a constant label made the audit's
    // (id, branch) table read this as one outcome fired five times in a
    // season when it is three genuinely different scenes chosen by the last
    // Round Table, and that table is how repetition gets noticed at all.
    // AND THE BRANCH SAYS WHICH, so the repetition table can see the two apart
    // — the same reasoning the note above gives for not returning a constant.
    // GROUNDED (once-skipped). The empty bed has a name and a manner of leaving
    // (murdered vs banished, from the round record); a nervy night is really
    // about the actor's OWN name at the last table, and a groundless one about
    // nothing at all. So the topic and its register are set per-branch: the dead
    // when the scene counts empty beds, the actor themself when it does not. See
    // grief-vigil in vp-tr/castle-day.js.
    const last = _lastGone();
    const tableDriven = grounded && isNervy(state);
    const baseless = pool === 'unfounded';
    const topicDir = tableDriven ? 'haunted'
      : baseless ? 'restless'
        : (last && last.byMurder === false) ? 'banished' : 'mourned';
    return { branch: grounded ? `awake-${state}` : 'awake-unfounded',
      actor, state, grounded, gone, threadId: t?.id,
      topicKind: 'grief-vigil', topicDir,
      topic: (tableDriven || baseless) ? actor : (last ? last.name : actor) };
  },
});
