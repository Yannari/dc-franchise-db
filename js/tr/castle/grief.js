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
import { lineFor, countWord, pronounSlots } from './lines.js';
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
    '{a} and {b} are the first two down, and {v}’s chair is still pushed in at the table.\n{b}: "Nobody’s moved it."\n{a}: "Nobody’s going to. Would you?"\n{b}: "No. God, no."\nThey sit down either side of it and neither of them looks at it.',
    '{b} is already at the table when {a} comes in. The place next to {b} is {v}’s, and it is laid.\n{a}: "They’ve still laid for {v}."\n{b}: "I know. I didn’t want to be the one to clear it."\n{a} sits down on the other side, leaving the gap.',
    '{a} catches {b} staring at {v}’s empty place.\n{a}: "You alright?"\n{b}: "Yeah. It’s just the chair, you know?"\n{a}: "I know."',
    '{b} pulls out {v}’s chair without thinking, realises, and pushes it back in.\n{b}: "Sorry. Habit."\n{a}: "Don’t be sorry. I nearly did the same."',
    'There is one chair too many at breakfast, and {a} and {b} both notice it at the same time.\n{a}: {say:grief-open:{v}}\n{b}: {say:grief-open:{v}}',
    '{a} and {b} sit either side of the gap where {v} should be.\n{b}: "It feels wrong, doesn’t it? Eating."\n{a}: "It does. Eat anyway."\nThey eat in silence for a while.',
  ],
  'moved-it-away': [
    '{b} was down before anyone else this morning. By the time {a} came in, {v}’s chair was already against the wall.\n{a}: "You moved it."\n{b}: "Somebody had to. I’m not eating breakfast next to a gap."\n{a}: "People are going to notice."\n{b}: "Good. Better that than staring at it all morning."',
    '{a} watches {b} lift {v}’s chair away from the table before the others come down.\n{a}: "Is that not a bit cold?"\n{b}: "It’s kinder. Trust me. Nobody wants to look at it."\n{a} doesn’t argue, and helps shift the others along.',
    '{a} came down this morning to a table with no gap in it.\n{a}: "Where’s {v}’s chair gone?"\n{b}: "I put it in the hall. I couldn’t look at it."\n{a}: "Fair enough. I don’t think I could either."',
    '{b} is stacking {v}’s chair against the wall when {a} walks in.\n{b}: "Don’t say anything."\n{a}: "I wasn’t going to."\n{b}: "It’s easier if it’s not there."\n{a}: "I know it is."',
  ],
  'laid-a-place': [
    '{a} lays a place for {v} anyway, and {b} watches {aObj} do it.\n{b}: "They’re not coming down."\n{a}: "I know. I’m doing it anyway."\n{b} leaves it where it is.',
    'There is a cup at {v}’s place. {b} put it there, and {a} notices.\n{a}: "Did you do that?"\n{b}: "Yeah. Is that weird?"\n{a}: "No. It’s nice. Leave it."',
    '{a} puts down one plate too many, on purpose.\n{b}: "That’s {v}’s."\n{a}: "I know whose it is."\nNobody moves it all breakfast.',
    '{a} straightens the knife and fork at {v}’s empty place.\n{b}: "You don’t have to do that."\n{a}: "I want to. It’s the only thing I can do."\n{b}: "Then I’ll help."',
  ],
  'nobody-noticed': [
    'This morning the table is laid for the right number first time. {a} and {b} are the only ones who seem to notice.\n{a}: "They didn’t lay for {v}."\n{b}: "No. They’re getting used to it."\n{a}: "I don’t want to get used to it."',
    '{a} looks for the gap where {v} sat and can’t find it.\n{a}: "Someone’s already moved everything round."\n{b}: "I didn’t see who."\n{a}: "That’s worse, somehow."',
    '{a} points at the table.\n{a}: "Nobody’s even left a space."\n{b}: "I know. I noticed."\n{a}: "Is that what we are now?"\n{b} doesn’t answer.',
    'Breakfast carries on as normal, and {a} and {b} seem to be the only ones who mind.\n{b}: "Nobody’s said {v}’s name yet."\n{a}: "Then I will. {v}. There."',
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
    '{a} and {b} look down the table at the same time.\n{a}: "{n}."\n{b}: "I know. I got there too."\n{a}: "It goes quick, doesn’t it?"',
    '{b} is counting heads when {a} sits down.\n{a}: "Don’t. I’ll tell you. {n}."\n{b}: "Thanks. I didn’t want to be the one to say it."',
    '{a} says the number out loud so {b} doesn’t have to.\n{a}: "{n} of us left."\n{b}: "It was a full table when we got here."\n{a}: "I know."',
    '{a} gets halfway down the table and stops.\n{b}: "{n}. You were going to say {n}."\n{a}: "Yeah. I was."',
  ],
  'left-it-unsaid': [
    '{b} catches {a} counting the table.\n{b}: "Don’t."\n{a}: "I wasn’t going to say it."\n{b}: "You were. Please don’t."\n{a} stops.',
    '{a} asks {b} how many are left.\n{b}: "I’m not doing that this morning."\n{a}: "Fair enough."\nNeither of them says the number.',
    '{a} starts counting out loud and {b} puts a hand up.\n{b}: "Please. Not today."\n{a}: "Sorry. You’re right."',
    '{b} changes the subject twice to stop {a} counting the table.\n{a}: "You don’t want to know, do you?"\n{b}: "I already know. I just don’t want to hear it."',
  ],
  'counted-the-chairs': [
    '{a} counts the toothbrushes in the bathroom.\n{a} (to camera): {cam:count:{n}}',
    '{a} counts the coats on the hooks by the door.\n{a} (to camera): {cam:count:{n}}',
    '{a} counts the plates as {aSub} lays the table.\n{a} (to camera): {cam:count:{n}}',
    '{a} counts the chairs instead of the people. It comes to the same thing.\n{a} (to camera): {cam:count:{n}}',
    '{a} counts the room twice, as if the number might change.\n{a} (to camera): {cam:count:{n}}',
    '{a} gets to {n}, then counts again from the other end of the table.\n{a} (to camera): {cam:count:{n}}',
    '{a} is counting heads again, and can’t stop.\n{a} (to camera): {cam:count:{n}}',
    '{a} counts the cups on the drainer, which is a slower way of getting to {n}.\n{a} (to camera): {cam:count:{n}}',
    'Somewhere between the stairs and the table, {a} has done the sum again.\n{a} (to camera): {cam:count:{n}}',
  ],
  'counted-the-useful-ones': [
    '{a} isn’t counting people this morning. {a} is counting allies.\n{a} (to camera): "{n} of us. People I’d actually trust? I can do that on one hand."',
    '{a} goes round the table working out who would still back {aObj} at the Round Table.\n{a} (to camera): "It’s not how many are left. It’s how many are on my side. That’s the scary number."',
    '{a} does the sum, then a second, more frightening sum underneath it.\n{a} (to camera): "{n} people. If it came to a vote on me tonight, I reckon I’ve got three."',
    '{a} sorts the breakfast table into two piles in {aPos} head.\n{a} (to camera): "There’s the ones I trust, and there’s everyone else. Everyone else is getting bigger."',
    '{a} counts the room, then counts it again with most of it left out.\n{a} (to camera): "{n} left, and maybe four I’d go to the end with. That’s not enough."',
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
      { a: actors[0], b: actors[1] || 'somebody', n: countWord(remaining) });
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
    '{a} sits somewhere new this morning, and {b} sits down right next to {aObj}.\n{b}: "This alright?"\n{a}: "Course. Stay there."',
    '{a} takes the chair furthest from the door, and {b} takes the one beside it.\n{a}: "Moving up in the world?"\n{b}: "I just wanted to sit with you, to be honest."',
    'The table has shuffled round overnight, and {a} ends up next to {b}.\n{b}: "Funny how that works."\n{a}: "It’s not funny. It’s the only seat I wanted."',
    '{b} came down this morning to find {a} had saved the chair next to {aObj}.\n{b}: "You saved me a seat this morning."\n{a}: "Who else would it be for?"',
  ],
  'kept-the-gap': [
    'The seats either side of {v}’s place stay empty. {a} and {b} both walk past them.\n{b}: "I’m not sitting there."\n{a}: "Me neither."\nThey sit at the far end together.',
    '{a} moves along rather than sit next to the gap, and {b} does the same.\n{a}: "Is it daft that I won’t sit there?"\n{b}: "No. I won’t either."',
    '{b} looks at the empty seat next to {v}’s place.\n{b}: "It’s just a chair."\n{a}: "Then you sit in it."\n{b} doesn’t.',
    'There is a hole in the middle of the table and everybody eats round the edge of it.\n{a}: "Somebody’s going to have to sit there eventually."\n{b}: "Not today."',
  ],
  'took-their-chair': [
    '{b} sits in {v}’s chair first thing, in front of everybody.\n{a}: "Really? That one?"\n{b}: "It’s a chair. Somebody has to sit in it."\n{a}: "Doesn’t have to be today."',
    '{a} came down this morning to find {b} in {v}’s seat, eating toast.\n{a}: "You sat in {v}’s place at breakfast."\n{b}: "I know. {v} would have laughed."\n{a} is not sure {v} would have.',
    '{b} takes {v}’s chair and holds the room’s eye while doing it.\n{a}: "Bold."\n{b}: "What, am I meant to tiptoe round it for a week?"',
    '{b} has wanted that seat since the first morning, and this morning takes it.\n{a}: "That was quick."\n{b}: "It’s the best seat at the table. {v} would’ve said the same."',
  ],
  'sat-apart': [
    '{a} and {b} sit at opposite ends of the table this morning, and both of them notice.\n{a} (to camera): "{b} walked straight past me. Didn’t even look. So that’s where we are."',
    '{b} takes a chair three places away from {a} and talks to someone else all through breakfast.\n{a} (to camera): "Yesterday we sat together. Today {b} wouldn’t sit next to me. I want to know what changed."',
    '{a} keeps a seat free for {b}. {b} doesn’t take it.\n{a} (to camera): "I kept that seat. {b} saw me keep it. And sat somewhere else."',
    'The table rearranges itself and {a} and {b} end up on different sides of it.\n{a} (to camera): "It’s only seats. But in here, nothing’s only anything."',
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
    '{a} and {b} end up on the back step with a cup of tea each, not saying much.\n{b}: "I keep thinking about {v}."\n{a}: "Me too."\nThey stay out there until the tea goes cold.',
    '{b} makes two cups of tea without asking and hands one to {a}.\n{a}: "Thank you."\n{b}: "You looked like you needed it. I did."',
    '{a} sits down next to {b} and stays there.\n{a}: "We don’t have to talk."\n{b}: "Good. I can’t, really."',
    '{a} and {b} do the washing up together, very slowly.\n{a}: "{v} always dried. Every morning."\n{b}: "I know. I was going to say that."',
  ],
  'told-a-story-about-them': [
    '{b} tells {a} something {v} said on the first night, and they both laugh.\n{b}: "And {v} just went, ‘well, that’s me murdered then.’"\n{a}: "{v} did not say that!"\n{b}: "Swear to God."\nThe laugh doesn’t last long.',
    '{a} and {b} spend breakfast talking about {v} — not the murder, just {v}.\n{a}: "Do you remember {v} trying to light the fire?"\n{b}: "Half the castle nearly went up."\n{a}: "It was the best bit of the week."',
    '{b} does {v}’s voice, and {a} laughs for the first time all day.\n{a}: "Stop it, that’s too good."\n{b}: "Somebody’s got to keep {v} going in here."',
    '{a} and {b} swap stories about {v} until somebody else comes in.\n{a}: "{v} would hate us being sad about it."\n{b}: "{v} would hate us talking about it at breakfast, more like."',
  ],
  'one-sided-grief': [
    '{a} is in pieces. {b} barely knew {v}, and is careful about it.\n{a}: "You understand, don’t you? {v} was my person in here."\n{b}: "Yeah. Course."\n{b} (to camera): "I didn’t really know {v}. I’m not going to pretend I did. I just sat there."',
    '{b} says all the right things to {a} and doesn’t feel much.\n{a}: "{v} was the only one I trusted."\n{b}: {say:comfort:{v}}\n{b} (to camera): "I feel bad, but I’d spoken to {v} about twice."',
    '{a} needs somebody to miss {v} as much as {aSub} does. {b} is who happens to be there.\n{a}: "Do you miss {v}? Properly?"\n{b}: "I didn’t know {v} like you did."\n{a}: "No. Nobody did."',
    '{a} talks about {v} all morning, and {b} listens.\n{a}: "Sorry. I keep going on."\n{b}: "Go on. It’s fine."\nBy lunch {a} has stopped talking about it to {b}, and {b} notices.',
  ],
  'could-not-say-it': [
    '{a} and {b} sit together. Neither of them can get a sentence about {v} out.\n{a}: "I just — {v} was—"\n{b}: "I know. You don’t have to."',
    '{a} tries three times to say something about {v}.\n{a}: "I wanted to say—"\n{b}: "Don’t. I know."\nThey sit there a bit longer.',
    '{b} starts to say something about last night, then stops.\n{a}: "What?"\n{b}: "Nothing. Doesn’t matter."\n{a} doesn’t push.',
    '{a} and {b} wash up in silence. Neither of them leaves first.\n{b}: "Thanks for this."\n{a}: "For what?"\n{b}: "Not talking."',
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
    '{a} leans over to {b} at breakfast.\n{a}: {say:who-benefits:{v}}\n{b}: "I’ve been asking myself the same thing."',
    '{a} keeps coming back to the same question.\n{a}: "Why {v}? And why last night?"\n{b}: "Because {v} was dangerous to them. Has to be."\n{a}: "Dangerous how, though?"',
    '{a} wants to know what {v} knew.\n{a}: "Did {v} say anything to you? About anyone?"\n{b}: "Not to me. You?"\n{a}: "No. That’s what worries me."',
    '{b} says it’s random. {a} isn’t having it.\n{b}: "They probably just picked someone."\n{a}: "Nothing in here is random. Somebody chose {v}."',
    '{a} and {b} go round it four times and end up where they started.\n{b}: {say:who-benefits:{v}}\n{a}: "We’re going in circles."\n{b}: "I know. Let’s stop."',
  ],
  'about-to-say-something': [
    '{b} remembers something about last night.\n{b}: "{v} was about to say something at the table. Do you remember?"\n{a}: "{v} started a sentence and stopped."\n{b}: "What if that’s why?"',
    '{a} has been thinking about {v}’s last conversation.\n{a}: "{v} was going to name someone. I’m sure of it."\n{b}: "Did {v} say who?"\n{a}: "No. And now we’ll never know."',
    '{a} says it quietly to {b}.\n{a}: "{v} knew something. They took {v} before it came out."\n{b}: "You can’t know that."\n{a}: "No. But I’d bet on it."',
    '{b} goes quiet, then says it.\n{b}: "{v} asked me last night who I trusted. Like {v} was working something out."\n{a}: "Did you tell {vObj}?"\n{b}: "I didn’t get the chance."',
  ],
  'we-had-it-wrong': [
    '{a} and {b} both suspected {v}. Now {v} has been murdered.\n{a}: "We had {v} down as a Traitor."\n{b}: "I know."\n{a}: "They don’t murder their own. So we were wrong."',
    '{a} puts it plainly.\n{a}: "We were wrong about {v}."\n{b}: "Completely."\n{a}: "So who’s been pointing us at {v}? Because someone was."',
    '{b} reminds {a} what they had both been saying about {v}.\n{b}: "We were going to vote for {v}. Last night."\n{a}: "Don’t. I feel sick about it."',
    '{a} and {b} had agreed about {v}. The murder has just proved them both wrong.\n{b}: "Where do we even go from here?"\n{a}: "Back to the start. Whoever made us suspect {v}."',
  ],
  'would-not-play': [
    '{a} starts on why {v}, and why now. {b} won’t have it.\n{b}: "Not this morning. Somebody’s dead."\n{a}: "I’m just trying to work it out."\n{b}: "Well, work it out without me."',
    '{a} wants to talk about who did it. {b} walks off mid-sentence.\n{b}: "Sorry. I can’t do this right now."\n{a} (to camera): "Everyone grieves differently. I just find it weird when someone won’t even talk about it."',
    '{b} won’t guess at all.\n{a}: "You must have a theory."\n{b}: "Not everything’s a clue."\n{a} files that away and doesn’t say anything.',
    '{a} asks the same question twice and gets the same non-answer.\n{a}: "Who do you think it was?"\n{b}: "I don’t know."\n{a}: "You must think something."\n{b}: "I think I want my breakfast."',
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
    '{a} doesn’t hide how hard it has hit. {b} sits down beside {a}.\n{b}: {say:comfort:{v}}\n{a}: {say:grief-reply:{v}}',
    '{a} says {v}’s name out loud, like it needs saying.\n{a}: {say:grief-open:{v}}\n{b}: "I know. Me too."',
    '{a} cries at the table in front of everyone and doesn’t apologise.\n{b}: {say:comfort:{v}}\n{a}: {say:grief-reply:{v}}',
    '{b} asks how {a} is doing, and gets a real answer.\n{a}: {say:grief-open:{v}}\n{b}: "I’m so sorry."',
    '{a} keeps starting sentences about {v} and not finishing them.\n{b}: "You don’t have to finish them."\n{a}: "I know. I just keep starting."',
    '{a} wants to talk about {v}, not about who did it.\n{a}: "Can we not play detective for five minutes? I just miss {v}."\n{b}: "Yeah. Course we can."',
    '{a} sits at the table long after it has emptied.\n{a} (to camera): {cam:grief:{v}}',
    '{a} goes and stands in the room where {v} used to leave {vPos} boots.\n{a} (to camera): {cam:grief:{v}}',
    '{a} is fine until somebody passes the toast the way {v} used to.\n{a} (to camera): {cam:grief:{v}}',
    '{a} says the name once at breakfast and then can’t say anything else.\n{a} (to camera): {cam:grief:{v}}',
    '{a} is the last one to look away from {v}’s portrait.\n{a} (to camera): {cam:grief:{v}}',
    '{a} barely knew {v}, and is taking it like losing an old friend.\n{a} (to camera): {cam:grief:{v}}',
  ],
  suspicious: [
    '{a} skips the grief and goes straight to the question.\n{a}: {say:who-benefits:{v}}\n{b}: "I don’t know. I haven’t even had a coffee."',
    '{a} already has a theory before breakfast is over.\n{a}: "Who went up last last night? Think about it."\n{b}: "I wasn’t really paying attention."\n{a}: "Well, start."',
    '{a} wants the timeline, not the eulogy.\n{a}: {say:ask-where}\n{b}: {say:answer-clean}\n{a}: "Okay. Who else was still up?"',
    '{b} wants to be sad about it. {a} wants the hour it happened in.\n{b}: "Can we just have a minute?"\n{a}: "We can have a minute. Then I want names."',
    '{a} watches faces rather than the empty chair.\n{a} (to camera): "Everyone’s crying. Fine. I’m watching who cries second."',
    '{a} treats the news as evidence rather than as news.\n{a} (to camera): "Sad, yes. But {v} going tells me who they were scared of. That’s useful."',
    '{a} has three names by the end of breakfast.\n{a} (to camera): "I came down with nothing. I’m leaving with three names."',
    '{a} is doing the maths before the room has finished reacting.\n{a} (to camera): {cam:grief:{v}}',
    '{a} asks around the table who went up the stairs, and when.\n{a} (to camera): "Nobody likes being asked where they were. That’s exactly why you ask."',
  ],
  stoic: [
    '{a} says almost nothing all morning. {b} notices.\n{b}: "You alright?"\n{a}: "Fine."\n{b} leaves {aObj} to it.',
    '{a} eats breakfast, clears the plate, and answers every question with one word.\n{b}: "Did you know {v} well?"\n{a}: "Bit."\n{b}: "Right."',
    '{a} is up before everyone else, dressed and useful, and completely unreachable.\n{b}: "Do you want to talk?"\n{a}: "No, I’m alright. Thanks."',
    '{b} watches {a} all morning for a reaction, and nothing shows.\n{b} (to camera): "I can’t tell if {a} is devastated or doesn’t care. That bothers me."',
    '{a} does the washing up, all of it, and barely says a word.\n{a} (to camera): {cam:grief:{v}}',
    '{a} puts the chairs back, straightens the table, and says nothing.\n{a} (to camera): {cam:grief:{v}}',
    '{a} goes quiet in a way that says more than talking would.\n{a} (to camera): {cam:grief:{v}}',
  ],
  opportunistic: [
    '{a} is the first person at {b}’s side, and the first person to say a name.\n{a}: {say:comfort:{v}}\n{a}: {say:suspect:{c}}\n{b}: "Really? You think so?"',
    '{a} comforts {b} all morning, and then, gently, points {bObj} somewhere.\n{a}: "I just think we need to look at who gains from this."\n{b}: "Like who?"\n{a}: {say:suspect:{c}}',
    '{a} is sorry, loudly, and then helpful, pointedly.\n{a}: {say:grief-open:{v}}\n{a}: "And honestly? Watch {c} today."\n{b} nods slowly.',
    '{a} says a name inside a condolence, which is hard to argue with.\n{a}: "{v} would want us to get whoever did this. And I keep coming back to {c}."\n{b}: "I hadn’t even thought about {c}."',
    '{a} makes sure to be seen being kind this morning.\n{a} (to camera): {cam:grief:{v}}',
    '{a} grieves for exactly as long as it takes the room to start listening.\n{a} (to camera): {cam:grief:{v}}',
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
    // THE NAME AN OPPORTUNIST STEERS TOWARDS: the living player the reactor
    // likes least, read off the bond graph (no rng), never the partner.
    const steerAt = (ctx.living || [])
      .filter(n => n !== reactor && n !== partner && n !== victim)
      .sort((x, y) => (getBond(reactor, x) - getBond(reactor, y)) || String(x).localeCompare(String(y)))[0]
      || 'somebody';
    let line = _sentenceCase(pronounSlots(pick(rng, _partnerSafe(REACTION_LINES[branch], partner))
      .replace(/\{a\}/g, reactor).replace(/\{v\}/g, victim)
      .replace(/\{b\}/g, partner || 'somebody').replace(/\{c\}/g, steerAt),
    { a: reactor, b: partner || '', v: victim }));

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
    '{a} goes up before anybody else and takes one small thing from {v}’s side of the room.\n{a} (to camera): "It’s just a bracelet. I’m not giving it to the production. I’m keeping it."',
    'Something of {v}’s went into {a}’s pocket before breakfast, and it’s still there.\n{a} (to camera): "It sounds soppy. I just didn’t want {v}’s stuff to be packed up by strangers."',
    '{a} came down to breakfast with one of {v}’s things and a very ordinary face.\n{a} (to camera): "I took {v}’s scarf. Don’t tell anyone. I don’t even know why."',
    '{a} keeps one thing of {v}’s and leaves the rest.\n{a} (to camera): "I didn’t want to take much. Just something, so I remember {vObj} properly."',
    '{a} checks the thing in {aPos} pocket about every ten minutes.\n{a} (to camera): "It’s still there. I keep checking. Weird, isn’t it?"',
  ],
  'handed-it-over': [
    '{a} finds something of {v}’s and takes it straight to {c}.\n{a}: "This should be yours. You were closest to {v}."\n{c}: "Oh my God. Thank you."\n{c} holds it for a long time.',
    '{a} puts one of {v}’s things down in front of {c} at breakfast.\n{c}: "Is that {v}’s?"\n{a}: "Yeah. I thought you should have it."\n{c} can’t answer, and doesn’t need to.',
    '{a} could have kept it, and gives it to {c} instead.\n{a}: "{v} would’ve wanted you to have this."\n{c}: "You didn’t have to do that."\n{a}: "I know."',
    '{c} hasn’t asked for anything of {v}’s. {a} brings it anyway.\n{a}: "Here. Don’t say anything."\n{c}: "I wasn’t going to. I can’t."',
  ],
  'put-it-back': [
    '{a} takes one of {v}’s things, holds it for a while, and then puts it back exactly where it was.\n{a} (to camera): "I thought I wanted something of {v}’s. I didn’t. It felt like stealing."',
    '{a} gets as far as the stairs with it, then turns round.\n{a} (to camera): "I put it back. It’s not mine, is it? It’s {v}’s."',
    '{a} folds {v}’s jumper, puts it where it goes, and shuts the door.\n{a} (to camera): "Somebody had to tidy it. I didn’t take anything. I couldn’t."',
    '{a} lines {v}’s things up neatly on the shelf and takes none of them.\n{a} (to camera): "I just wanted it to look nice. For when they pack it."',
  ],
  'set-it-out': [
    '{a} puts {v}’s mug at {v}’s empty place at breakfast, and sits down.\n{a} (to camera): "I’m not letting this lot pretend {v} was never here."',
    'By the time the others come down, one of {v}’s things is on the table where {v} used to sit.\n{a} (to camera): "Call it a memorial. Call it whatever. It’s staying there."',
    '{a} lays something of {v}’s out where everybody has to walk past it.\n{a} (to camera): "Whoever did this can look at it all through breakfast. Good."',
    '{a} puts {v}’s cup back on the table and says nothing about it.\n{a} (to camera): "Half of them looked at it. Half of them looked away. I watched which half."',
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
    '{a} puts down {aPos} fork and says it to the whole table.\n{a}: "Somebody in this room let {v} die. Somebody sat here last night and knew."\n{b}: "We all know that."\n{a}: "Then why is everyone eating like it’s normal?"',
    '{a} is not grieving so much as furious.\n{a}: "One of you said goodnight to {v} knowing. One of you."\n{b} watches who looks up.',
    '{b} says it is nobody’s fault. {a} isn’t having it.\n{b}: "It’s the game. It’s nobody’s fault."\n{a}: "It’s somebody’s fault. That’s literally the game."',
    '{a} stands up at breakfast.\n{a}: "I just want whoever did it to know I’m looking at them. That’s all."\n{b}: "Sit down, mate."\n{a} sits down, still looking round the table.',
  ],
  'named-a-number': [
    '{a} does the maths out loud.\n{a}: "There’s three of them, probably. At this table. Three people lied to us last night."\n{b}: "Keep your voice down."\n{a}: "Why? They already know."',
    '{a} puts a figure on it, and the figure scares people more than an accusation would.\n{a}: "It’s not one person. It’s a few. They sat here and decided."\n{b}: "You’re frightening people."\n{a}: "Good."',
    '{b} tries to soften it. {a} says it again.\n{a}: "More than one person in this room knew {v} was going."\n{b}: "You don’t know that."\n{a}: "It’s how the game works. Of course I know that."',
    '{a} counts round the table with {aPos} eyes.\n{a}: "Any of you. Any three of you."\n{b} (to camera): "{a} isn’t wrong. That’s what made it so horrible."',
  ],
  'turned-on-them': [
    '{a} starts off blaming the room and ends up blaming {b}.\n{a}: "And you were the last one up, weren’t you?"\n{b}: "Are you serious?"\n{a}: "I’m just saying what I saw."',
    'It’s general for about a minute, and then it’s about {b}.\n{a}: "You were quiet last night. Really quiet."\n{b}: "Because I was tired! Oh my God."',
    '{b} is standing there, and {a}’s anger has to go somewhere.\n{a}: "You didn’t even look sad when they said {v}’s name."\n{b}: {say:deny}\n{a} doesn’t look convinced.',
    '{b} answers calmly, which only makes {a} angrier.\n{a}: "Why are you so calm about it?"\n{b}: "Because shouting at me won’t bring {v} back."\n{a}: "Don’t tell me how I should feel."',
  ],
  'blamed-themselves': [
    '{a} blames the room, and then blames {aRef}.\n{a}: "I heard something last night. On the landing. I went back to sleep."\n{b}: "You couldn’t have known."\n{a}: "I could’ve got up."',
    'Halfway through, {a}’s anger turns round on {aRef}.\n{a}: "I told {v} I’d look out for {vObj}. I promised."\n{b}: "It’s not your fault."\n{a}: "Tell me that again in a week."',
    '{b} tells {a} it isn’t {aPos} fault, four times.\n{b}: "It’s not on you."\n{a}: "It feels like it is."\n{b}: "It’s not. I promise you it’s not."',
    '{a} apologises to {v}’s empty chair, in front of the others, and leaves the room.\n{b} (to camera): "I didn’t know what to say. Nobody did."',
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
    '{a} and {b} pour a glass each and go through the names of everyone they’ve lost.\n{a}: "To all of them."\n{b}: "All {n} of them."\nThey drink.',
    '{a} lifts a glass to the empty end of the table, and {b} lifts one back.\n{b}: "Go on then. Say them."\n{a} says every name, in order. {b} says them back.',
    '{a} says a name, {b} says a name, and they keep going until there are none left.\n{a}: "That’s everyone."\n{b}: "That’s too many."',
    '{a} and {b} drink to the ones who went first.\n{a}: "We came in with some of them."\n{b}: "I know. Cheers, all of you."',
  ],
  'could-not-finish': [
    '{b} starts a toast and can’t finish it.\n{b}: "To—"\n{a}: "It’s alright."\n{b}: "I can’t even get through the list."',
    'They get four names in and {a} puts the glass down.\n{a}: "I didn’t realise how long it was."\n{b}: "No. Me neither."',
    '{a} has no idea how long the list has got until {aSub} tries to say it out loud.\n{a}: "How is it this many already?"\n{b}: "Just drink. We’ll do the rest another night."',
    'The toast stops somewhere in the middle.\n{b}: "It’s fine."\n{a}: "It’s not, though."\n{b}: "No. It’s not."',
  ],
  'turned-into-a-vow': [
    'It starts as a toast to the dead, and turns into a promise.\n{b}: "To them."\n{a}: "And to us not joining them."\n{b}: "Deal."\nThey clink glasses on it.',
    '{a} raises a glass to everyone who has gone, then to the two of them.\n{a}: "And to us. To the end."\n{b}: "To the end."',
    'The names run out, and what’s left is {a} and {b} making a deal.\n{a}: "Whatever happens, I’m not writing your name."\n{b}: "And I’m not writing yours. Cheers."',
    '{a} and {b} start the evening mourning and finish it with a plan.\n{b}: "We look after each other. That’s it."\n{a}: "That’s it."',
  ],
  'nobody-joined-in': [
    '{a} and {b} raise a glass to the dead, and the rest of the table carries on eating.\n{b}: "Nobody else is joining in."\n{a}: "Then it’s just us. That’s fine."',
    '{a} says the names loud enough for the table to hear. The table doesn’t look up.\n{b} (to camera): "That really upset me. Nobody even stopped eating."',
    '{b} looks round for someone else to lift a glass, and can’t find anyone.\n{a}: "Leave them. Cheers."\n{b}: "Cheers."',
    'It was meant to be for everybody. It ends up being just {a} and {b}.\n{a}: "They’ve got used to it already."\n{b}: "I don’t want to get used to it."',
  ],
  'poured-two': [
    '{a} lifts a mug of tea to the empty chairs and says nothing.\n{a} (to camera): {cam:count:{n}}',
    '{a} stands at the window with a glass and says the names, quietly.\n{a} (to camera): "I don’t want them forgotten. That’s all."',
    '{a} pours two small glasses, drinks one, and tips the other into the sink.\n{a} (to camera): "Silly ritual. I need it."',
    '{a} raises a glass to the portraits on the wall.\n{a} (to camera): {cam:count:{n}}',
    '{a} has a quiet drink on the back step, alone.\n{a} (to camera): "Cheers, everyone who’s gone. I’m still here."',
    '{a} says the name of the last person to go, and then the one before.\n{a} (to camera): "I say them every night. Otherwise it’s like they were never here."',
    '{a} pours two glasses, drinks one, and leaves the other where it is.\n{a} (to camera): "One for me, one for them. It’s silly, I know."',
    'Nobody else is in the kitchen. {a} says one name out loud and drinks to it.\n{a} (to camera): {cam:count:{n}}',
    '{a} says every name under {aPos} breath, standing at the sink.\n{a} (to camera): "I do it every night now. All {n} of them. Nobody knows."',
    '{a} raises a glass to an empty kitchen and puts it down again.\n{a} (to camera): "You have to mark it somehow. Otherwise they just vanish."',
    '{a} leaves a full glass on the table for nobody, and goes up.\n{a} (to camera): "That one’s for whoever’s next. Hopefully not me."',
    '{a} gets as far as saying two of the names and decides that’s enough for tonight.\n{a} (to camera): "I can’t do the whole list tonight. I’ll do it tomorrow."',
    'The rest of the castle is noisy in the other room. {a} stays where it’s quiet.\n{a} (to camera): "{n} people. I drink to them every night. It’s the only bit of the day I don’t have to act."',
    '{a} lifts a glass to an empty chair, feels a bit ridiculous, and does it anyway.\n{a} (to camera): "If anyone walked in right now I’d die. But I needed to do it."',
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
        { a, n: countWord(gone) });
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
      { a, b, n: countWord(gone) });
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
    'Another empty chair, and {a} and {b} both notice they feel less than they did.\n{a}: "Is it bad I’m not crying this time?"\n{b}: "No. I’m not either. I think we’re just tired."',
    '{a} looks at {v}’s place and just eats.\n{b}: "You alright?"\n{a}: "Yeah. That’s the scary part. I am."',
    '{b} realises {a} hasn’t even mentioned {v} yet.\n{b}: "You haven’t said anything about {v}."\n{a}: "What is there to say? It happens every morning now."',
    'The shock has gone out of it. {a} and {b} both know it.\n{a}: "Remember the first morning? We were in bits."\n{b}: "Now it’s just breakfast."',
  ],
  'one-of-them-still-feels-it': [
    '{a} has gone numb to it. {b} hasn’t.\n{a}: "You okay?"\n{b}: "No. How are you okay? How is everyone okay?"\n{a} doesn’t have an answer.',
    '{b} is the only one at the table still taking it hard.\n{b}: "Does nobody care any more?"\n{a}: "We care. We’re just tired of caring."\n{b}: "Well, I’m not."',
    '{a} watches {b} cry over {v}, and realises {aSub} can’t any more.\n{a} (to camera): "{b} still feels every one of them. I used to. I don’t know when that stopped."',
    '{b} counts every loss out loud. {a} has stopped counting.\n{b}: "That’s {v}. That’s another one."\n{a}: "I know. Come on, sit down."',
  ],
  'said-it-and-regretted-it': [
    '{a} says what everyone’s thinking, and wishes {aSub} hadn’t.\n{a}: "At least it wasn’t one of us."\n{b}: "Wow."\n{a}: "That came out wrong."',
    '{a} tries to make a joke about the murders and it lands badly.\n{a}: "Well, who’s next, then?"\n{b}: "Seriously?"\n{a}: "Sorry. Sorry. I didn’t mean that."',
    '{a} says it out loud.\n{a}: "Honestly, I’m relieved it wasn’t me."\n{b}: "You can’t say that."\n{a}: "Everyone’s thinking it."',
    '{a} tells {b} {aSub} barely feels it any more, and regrets it straight away.\n{b}: "That’s cold."\n{a}: "I know. Forget I said it."',
  ],
  'performed-it': [
    '{a} watches the whole castle grieve like it has done this before.\n{a}: "Everyone looks sad in exactly the same way now."\n{b}: "What do you mean?"\n{a}: "Nothing. Just watch."',
    '{a} and {b} watch the morning play out.\n{a}: "Hug, sit down, say something nice about them, eat. Every morning."\n{b}: "That’s grim."\n{a}: "It’s true, though."',
    '{a} notices the room has got good at grief.\n{a} (to camera): "Everyone’s very good at looking upset now. Which means one of them is very good at pretending."',
    '{a} keeps an eye on who is grieving properly and who is doing it for the room.\n{a}: "Some of them are crying on cue. I’d put money on it."\n{b}: "That’s harsh."\n{a}: "Watch them, then."',
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
    const note = lineFor(NUMB_LINES[branch], `grief-numb-to-it-now|${branch}|${ctx.ep}`, { a, b, v: v || 'them' });
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
    '{a} went somewhere quiet before breakfast, cried for five minutes, then washed {aPos} face.\n{a} (to camera): "You get it out of your system away from everyone. Then you go down and you’re fine."',
    '{a} had a moment alone in the bathroom before breakfast and came down looking completely normal.\n{a} (to camera): "Nobody needs to see that. I’m not giving anyone the satisfaction."',
    '{a} lets it out on the landing, then puts it away.\n{a} (to camera): {cam:grief:{v}}',
    '{a} takes a minute on the back stairs before facing the table.\n{a} (to camera): "Right. Done. Face on. Let’s go."',
    '{a} cries in the shower, where nobody can hear.\n{a} (to camera): "It’s the only place in the castle you’re properly on your own."',
  ],
  'was-found': [
    '{c} finds {a} crying on the back stairs, and sits down.\n{c}: {say:comfort:{v}}\n{a}: {say:grief-reply:{v}}\n{c} stays until {a} is ready to go in.',
    '{a} thought nobody would come looking. {c} does.\n{c}: "Hey. Hey. Come here."\n{a}: "Sorry. I didn’t want anyone to see."\n{c}: "It’s only me."',
    '{c} hears {a} in the corridor and knocks.\n{c}: "You alright in there?"\n{a}: "Not really."\n{c}: "Can I come in?"\n{a}: "Yeah."',
    '{c} sits down next to {a} without saying anything for a while.\n{a}: "How did you know where I was?"\n{c}: "I didn’t. I just looked."',
  ],
  'did-not-come-down': [
    '{a} doesn’t come down to breakfast at all.\n{a} (to camera): "I couldn’t face it. The chair, the looks, all of it. Not today."',
    'There is a second empty place at breakfast. {a} stays in bed.\n{a} (to camera): "I know how it looks, not going down. I don’t care how it looks."',
    '{a} misses breakfast and misses the first hour of the day.\n{a} (to camera): {cam:grief:{v}}',
    '{a} stays upstairs until the others have gone out.\n{a} (to camera): "I just needed an hour where nobody was looking at me."',
  ],
  'came-down-angry': [
    '{a} came down to breakfast angry, not sad.\n{a} (to camera): "I cried, and then I got angry, and angry is more useful."',
    '{a} walks into breakfast with a face like thunder.\n{a} (to camera): {cam:grief:{v}}',
    '{a} has done crying. Now {aSub} wants a name.\n{a} (to camera): "Somebody at that table did this. I’m not being sad about it any more. I’m going to find them."',
    '{a} sat through breakfast staring round the table, and hasn’t stopped.\n{a} (to camera): "I want them to see me looking. I want them nervous."',
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
      { a: actor, c: finder || 'somebody', v: _victimLastNight(ctx.ep) || 'them' });
    const parties = branch === 'was-found' ? [actor, finder] : [actor];
    const t = api.openArc(FAMILY, parties, { source: sceneWhy, seed: why ? `${line}
${why.trim()}` : line });
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
    '{a} and {b} both suspected {v}. Now {v} has been murdered.\n{a}: "We were so sure about {v}."\n{b}: "I know."\n{a}: "And they killed {vObj}. So {v} was Faithful all along."',
    '{b} says it quietly over breakfast.\n{b}: "We nearly voted {v} out."\n{a}: "And the Traitors took {vObj} instead."\n{b}: "Which means we were completely wrong."',
    '{a} feels sick about it.\n{a}: "I said {v}’s name at the table. Out loud."\n{b}: "So did I."\n{a}: "{v} must have hated us."',
    '{a} and {b} work it out at the same time.\n{b}: "If {v} was a Traitor they wouldn’t have murdered {vObj}."\n{a}: "So somebody talked us into it."\n{b}: "Who, though?"',
  ],
  'owned-the-mistake': [
    '{a} says it out loud.\n{a}: "I was wrong about {v}. I said it was {v}, and I was wrong."\n{b}: "We all were."\n{a}: "I was loudest. That’s on me."',
    '{a} owns it before anyone else can bring it up.\n{a}: "I owe {v} an apology I can’t give now."\n{b}: "That’s a big thing to say."\n{a}: "It’s true, though."',
    '{a} tells {b} straight.\n{a}: "I got {v} wrong. I won’t do that to someone else."\n{b}: "Then don’t. Be careful tonight."',
    '{a} can’t stop thinking about it.\n{a}: "I made everyone look at {v}. And the whole time it was someone else."\n{b}: "You didn’t know."\n{a}: "I should’ve."',
  ],
  'still-think-we-were-right': [
    '{a} won’t clear {v} of anything.\n{a}: "It doesn’t prove {v} was Faithful."\n{b}: "They murdered {vObj}!"\n{a}: "Maybe that’s exactly what they want us to think."',
    '{a} still has doubts, even now.\n{a}: "Traitors can murder their own. It’s been done."\n{b}: "That’s mad."\n{a}: "Is it?"',
    '{b} wants to say sorry to {v}’s memory. {a} doesn’t.\n{a}: "I’m not apologising. I had reasons."\n{b}: "{v} is dead, {a}."\n{a}: "In the game. I know."',
    '{a} keeps to {aPos} position.\n{a}: "I stand by it. Something was off with {v}."\n{b} (to camera): "{a} just won’t admit being wrong. That’s worrying."',
  ],
  'turned-on-each-other': [
    '{a} and {b} both suspected {v}, and now they argue about whose idea it was.\n{a}: "You brought {v} up first."\n{b}: "No, you did! On the walk!"\n{a}: "I only agreed with you."',
    '{b} blames {a}.\n{b}: "You kept pushing {v}. Every day."\n{a}: "And you went along with it."\n{b}: "Because you were so sure."',
    'The guilt turns into an argument.\n{a}: "Don’t put this on me."\n{b}: "I’m not putting it on you. I’m saying you started it."',
    '{a} and {b} stop agreeing about anything.\n{a}: "So whose fault is {v}, then?"\n{b}: "The Traitors’. And maybe a bit yours."',
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
    '{a} lies awake, thinking about the vote tomorrow.\n{a} (to camera): "My name came up at the table. If it comes up again, I’m gone. I can’t sleep."',
    '{a} is still up long after the corridor has gone quiet.\n{a} (to camera): "I heard my name last night. I keep hearing it."',
    '{a} gets up, sits on the end of the bed, and doesn’t lie back down.\n{a} (to camera): "Either they murder me, or the table banishes me. That’s where I’m at."',
    '{a} counts the votes against {aObj} again in the dark.\n{a} (to camera): "I’ve got to change some minds tomorrow. I don’t know how."',
  ],
  paranoid: [
    '{a} lies awake, listening for footsteps.\n{a} (to camera): "Every creak, I think it’s them coming for me."',
    '{a} hears the stairs go at two in the morning and doesn’t sleep after that.\n{a} (to camera): "Somebody was up. I want to know who."',
    '{a} is sure someone said {aPos} name at the table and meant it.\n{a} (to camera): "They’re coming for me. Either tonight or at the Round Table."',
    '{a} lies there going through who said {aPos} name, and when.\n{a} (to camera): "I know who wants me out. I just don’t know if they’re Traitors or just stupid."',
  ],
  unfounded: [
    '{a} can’t sleep, and can’t say why.\n{a} (to camera): "Nobody’s said my name. I just feel like they’re about to."',
    '{a} lies awake with nothing to worry about, worrying.\n{a} (to camera): "I’m safe. I think I’m safe. Why don’t I feel it?"',
    '{a} gets up for water three times.\n{a} (to camera): "Nothing’s happened. That’s what’s keeping me up. Nothing ever happens until it does."',
    '{a} lies awake running through every conversation from the day.\n{a} (to camera): "Did I say too much? I always think I’ve said too much."',
  ],
  content: [
    '{a} lies awake thinking about the people who have gone.\n{a} (to camera): {cam:count:{n}}',
    '{a} can’t sleep, and ends up at the window.\n{a} (to camera): "You lie here and you think, who’s not coming down tomorrow?"',
    '{a} stays up, not scared, just thinking.\n{a} (to camera): "I feel alright, weirdly. I just can’t switch my head off."',
    '{a} listens to the castle settle and doesn’t sleep till late.\n{a} (to camera): "It’s so quiet at night. You’d never know what goes on upstairs."',
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
    const line = pronounSlots(pick(rng, NIGHT_AWAKE_LINES[pool] || NIGHT_AWAKE_LINES.content)
      .replace(/\{a\}/g, actor).replace(/\{n\}/g, countWord(gone)), { a: actor });
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: line });
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

// ══════════════════════════════════════════════════════════════════════
// THE MORNING AFTER A CHALICE, and the object the room cannot read
// ══════════════════════════════════════════════════════════════════════
//
// The chalice is the only murder that leaves something behind IN THE ROOM.
// Every other night takes somebody out of a bed; this one is done in company,
// with a glass, and the glass is still there in the morning. The castle had
// nothing to say about that — the night showed on the conclave screen, the
// memory of the pouring went into the Round Table's sources, and between the
// two of them the morning itself was silent.
//
// WHAT THE ROOM IS ALLOWED TO KNOW, on quiet-night.js's rule. Not that there
// was poison. Not that anybody was handed anything. A glass on a table, an
// evening most of them only half remember, and no reason to connect the two.
// Every branch below is people looking straight at the only physical evidence
// this format ever produces and seeing crockery. The connection is made
// somewhere else or not at all: `variantEvidence` gives the memory of the
// pouring to whoever was watching, at a price, and that is the channel that
// can reach a table. This one cannot, and must not.
//
// NOBODY HAS BEEN NAMED YET, which is the whole reason this scene can exist:
// the pool may not say who is missing, because at that breakfast the castle
// has been shown turned-over cups and no name at all.
function _chaliceLastNight(ep) {
  // FOUND BY EPISODE, not off the end of the list: `_victimLastNight` above
  // does the same, and for the same reason — tonight's round object already
  // exists by the time this morning's scenes are drawn.
  const round = (gs?.tr?.rounds || []).find(r => r.ep === ep - 1);
  if (!round || round.variant !== 'chalice') return null;
  const d = round.variantData;
  // FOUND, POURED, DRUNK — AND SLOW. A night the pact never found the cup
  // leaves the room exactly as it was, and a Shield leaves everybody at
  // breakfast. The fast kind is left to the rest of this family: the castle
  // has been told who died and is looking at a chair, not at crockery.
  //
  // MEASURED BEFORE IT WAS NARROWED: 320 seasons produced 100 chalice
  // mornings, 92 of them slow. A second pool written for the other eight
  // fired ZERO times, because a fast morning runs `breakfast-fallout` as well
  // and this family has spent its budget by the time `morning` comes round.
  // Deleted rather than shipped.
  if (!d || !d.found || !d.slow || !round.murdered) return null;
  return { victim: round.murdered, slow: true };
}

const LAST_GLASS_LINES = {
  'still-there': [
    'The glass from last night is still on the table. Nobody has moved it.\n{a}: "That’s the one, isn’t it?"\n{b}: "Don’t touch it."\n{a}: "I wasn’t going to."',
    '{a} and {b} stand looking at the one glass nobody has cleared.\n{b}: "Whoever drank from that is gone."\n{a}: "And whoever poured it is sat at breakfast."',
    '{a} spots the glass first.\n{a}: "They left it there."\n{b}: "On purpose?"\n{a}: "Everything in here is on purpose."',
    '{b} goes to clear the table and stops at the glass.\n{b}: "I can’t pick that up."\n{a}: "Leave it. I’ll do it later."',
  ],
  'washed-them-all': [
    'Every glass from last night is already washed and put away.\n{a}: "Who did the washing up?"\n{b}: "Not me. It was done before I got down."\n{a}: "That’s helpful, isn’t it. For somebody."',
    '{a} finds the draining board full of clean glasses.\n{a}: "Someone’s been busy."\n{b}: "Maybe they just couldn’t sleep."\n{a}: "Maybe."',
    'The glasses are washed before anyone comes down.\n{b}: "Well, that’s the evidence gone."\n{a}: "If there was any."\n{b}: "There’s always some."',
    '{a} asks round who washed up. Nobody says.\n{a} (to camera): "Somebody got up early and washed every glass. And nobody’s owning up to it."',
  ],
  'who-had-what': [
    '{a} and {b} try to work out who was drinking what last night.\n{a}: "You were on red, I was on white."\n{b}: "And the rest of the table?"\n{a}: "I honestly can’t remember."',
    '{a} tries to put the evening back together.\n{a}: "Who poured the last round?"\n{b}: "I thought you did."\n{a}: "I didn’t pour anything."',
    '{b} gets a piece of paper out.\n{b}: "Right. Who sat where, and who had which glass."\n{a}: "That’s very organised."\n{b}: "Somebody has to be."',
    '{a} and {b} go round in circles on who drank from what.\n{a}: "We’ll never get it back."\n{b}: "No. And they know that."',
  ],
  'thought-nothing-of-it': [
    '{a} clears the table without looking at it.\n{b}: "Was that last night’s?"\n{a}: "Probably. Why?"\n{b}: "No reason."',
    '{a} and {b} wash up and chat about the mission, not about the glasses.\n{a}: "Did you see the state of the kitchen?"\n{b}: "Awful. Pass me that."',
    '{a} tips the dregs down the sink.\n{b}: "Should we have kept that?"\n{a}: "Kept it for what?"\n{b}: "I don’t know. Never mind."',
    '{a} and {b} don’t give the glasses a second thought.\n{a} (to camera): "It was just washing up. I didn’t think about it till later."',
  ],
};

registerEvent({
  id: 'grief-the-last-glass',
  family: FAMILY,
  // MORNING, NOT DAWN, and the reason is the slow poison. `breakfast-fallout`
  // (the dawn phase) is SKIPPED WHOLESALE on a hidden morning — headless.js
  // does not run it when nobody has been told who died — and a slow chalice is
  // a hidden morning. Written for dawn, this scene would have been unreachable
  // on the three nights in four it is actually about. `morning-life` runs on
  // those mornings, with the decoys kept out of the room.
  window: 'morning',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'temperament', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // ABOVE `grief-empty-chair`'s 3, on `night-overruled-in-the-turret`'s
    // argument: its gate is already the rarest in the pool — one morning in a
    // season that ran a chalice at all — so the weight does not make it
    // common, it makes it the scene of the morning on the mornings it is
    // available. At 3 it fired on a fifth of them.
    return _chaliceLastNight(ctx.ep) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-last-glass');
    const [a, b] = ctx.actors;
    // NOTHING HERE READS THE NIGHT. The gate is in `weight()`; every line in
    // the pool is about the table this morning and none of them names anybody
    // who is missing, so `fire()` needs no fact the probe world in
    // tests/tr-castle-write-path.test.js cannot give it. An event that throws
    // without its gate is an event that writes no receipt.
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      // The sharper the pair, the likelier one of them stops at the object.
      'still-there': 0.3 + (sa.intuition / 10) * 0.3,
      'washed-them-all': 0.2 + (sb.strategic / 10) * 0.3,
      'who-had-what': 0.2 + ((sa.mental + sb.mental) / 20) * 0.35,
      'thought-nothing-of-it': Math.max(0.12, 0.5 - ((sa.intuition + sb.intuition) / 20) * 0.5),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'still-there';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'washed-them-all' ? 'the glasses were washed before anybody came down'
      : branch === 'who-had-what' ? 'tried to put last night’s drinks back in order'
        : branch === 'thought-nothing-of-it' ? 'cleared the table without looking at it'
          : 'the glass nobody would move';
    const note = lineFor(LAST_GLASS_LINES[branch],
      'grief-the-last-glass|' + branch + '|' + ctx.ep, { a, b });
    // The pair are closer for having stood in that kitchen together, and least
    // so on the branch where neither of them noticed anything.
    const bondDelta = branch === 'thought-nothing-of-it' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      // NO VICTIM FIELD AT ALL. The castle has not been told who is missing,
      // and a scene record that names them is one screen away from saying it
      // out loud.
      victim: null, topic: null,
      topicKind: 'grief-loss', threadId: t?.id, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// THE OTHER SHAPES OF NIGHT, and what the room has to look at
// ══════════════════════════════════════════════════════════════════════
//
// The murder catalogue gives a night seven shapes and the castle had a scene
// for exactly one of them (`grief-the-last-glass`, above). Every other twist
// night was narrated on the conclave screen, entered the Round Table's
// sources, and left the morning itself saying the same things it says after an
// ordinary murder — which is the written-but-unreachable shape this project
// keeps finding, one layer up: the content exists, and the day it belongs to
// never mentions it.
//
// THE RULE IS quiet-night.js's, AND IT IS WHAT DECIDES WHICH SHAPES GET ONE.
// A scene may only be built on what the room can SEE. Measured against that,
// the catalogue splits in two:
//
//   double        two empty chairs. The loudest public fact in the format.
//   hidden        several people missing and no name against any of them.
//   plain-sight   everybody was in one room all evening, and one of them
//                 is gone anyway.
//
// and the three that leave nothing public at all — `on-trial` (a list nobody
// is shown), `face-to-face` (a chapel nobody is taken to twice) and `dungeon`
// (which already has its own evidence channel and would be a second, free copy
// of it) — get no scene, because a scene would be the room reasoning from a
// fact it was never given.
function _lastRound(ep) {
  return (gs?.tr?.rounds || []).find(r => r.ep === ep - 1) || null;
}

/** Two names, and the castle counting to two. */
function _doubleLastNight(ep) {
  const r = _lastRound(ep);
  if (!r || r.variant !== 'double') return null;
  const v = r.variantData?.victims || [];
  // A Shield on the second name leaves ONE chair empty, and this is not that
  // morning — `_shapeNight` narrates that night as a standard murder for the
  // same reason (js/tr/murder.js).
  return v.length === 2 ? { victims: [...v] } : null;
}

/** People missing, no name, and an afternoon to wait for. */
function _hiddenLastNight(ep) {
  const r = _lastRound(ep);
  if (!r || r.variant !== 'hidden') return null;
  const c = r.variantData?.coffins || [];
  return c.length >= 3 ? { n: c.length } : null;
}

/** A whole evening in one room, and somebody gone out of the middle of it. */
function _plainSightLastNight(ep) {
  const r = _lastRound(ep);
  if (!r || r.variant !== 'plain-sight' || !r.murdered) return null;
  return { victim: r.murdered };
}

// ── TWO CHAIRS ───────────────────────────────────────────────────────
const TWO_CHAIRS_LINES = {
  'counted-twice': [
    '{a} counts the table and gets two missing.\n{a}: "Two. There’s two gone."\n{b}: "They took two?"\n{a}: "Count it yourself."',
    '{b} counts, then counts again.\n{b}: "That can’t be right."\n{a}: "It is. Two chairs."\n{b}: "They’ve never done that before."',
    '{a} and {b} look at the two empty places.\n{a}: "Two in one night."\n{b}: "They’re getting greedy."',
    '{a} gets to the end of the table and has to start again.\n{a}: "We’ve lost two, not one."\n{b}: "Oh my God."',
  ],
  'which-one-first': [
    '{a} tries to put the two murders in order.\n{a}: "Who do you think they went for first?"\n{b}: "Does it matter?"\n{a}: "It might. The first one was the one they really wanted."',
    '{b} thinks one of them was the real target.\n{b}: "One was planned. The other was just a bonus."\n{a}: "Which one was planned, though?"',
    '{a} and {b} argue about which of the two mattered more to the Traitors.\n{a}: "It has to be the first one."\n{b}: "We don’t know which was first."\n{a}: "No. That’s the problem."',
    '{a} works it through.\n{a}: "If you could take two, who would you take?"\n{b}: "The two biggest threats."\n{a}: "So who thought those two were threats?"',
  ],
  'what-it-tells-them': [
    '{b} reads the double murder as a message.\n{b}: "They’re scared. You don’t take two unless you’re scared."\n{a}: "Or confident."\n{b}: "Either way, it tells us something."',
    '{a} and {b} try to work out what two empty chairs say.\n{a}: "Those two were getting close."\n{b}: "To who, though?"\n{a}: "That’s what we find out today."',
    '{b} is already making notes.\n{b}: "Who were those two talking to yesterday? Because that’s our list."\n{a}: "That’s half the castle."\n{b}: "Then it’s half the castle."',
    '{a} thinks it’s a decision, not bad luck.\n{a}: "They chose those two. Together. Why together?"\n{b}: "Because together they were dangerous."',
  ],
  'no-arithmetic-today': [
    '{a} won’t count the room this morning.\n{a}: "Don’t tell me the number. I don’t want to know."\n{b}: "Okay. I won’t."',
    '{b} starts working out who is missing, and {a} stops {bObj}.\n{a}: "Not today. Please."\n{b}: "Alright. Sorry."',
    '{a} sits down and puts {aPos} head in {aPos} hands.\n{b}: "Two, {a}."\n{a}: "I know. I don’t want to talk about it."',
    '{a} and {b} just sit together.\n{b}: "Should we work out who it was?"\n{a}: "Later. Not now."',
  ],
};

registerEvent({
  id: 'grief-two-chairs',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'loyalty'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // ABOVE `grief-empty-chair`'s 3 for `night-overruled-in-the-turret`'s
    // reason: the gate is one morning in a season that ran a double at all,
    // so the weight decides whether it is the scene of that morning, not how
    // often the morning comes round.
    return _doubleLastNight(ctx.ep) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-two-chairs');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'counted-twice': 0.4,
      'which-one-first': 0.15 + (sa.mental / 10) * 0.3,
      'what-it-tells-them': 0.15 + (sb.strategic / 10) * 0.35,
      'no-arithmetic-today': 0.12 + ((10 - sa.temperament) / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'counted-twice';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'which-one-first' ? 'tried to put the two of them in an order'
      : branch === 'what-it-tells-them' ? 'read two empty chairs as a decision rather than a loss'
        : branch === 'no-arithmetic-today' ? 'would not count the room this morning'
          : 'counted the room twice and got two missing';
    const note = lineFor(TWO_CHAIRS_LINES[branch],
      'grief-two-chairs|' + branch + '|' + ctx.ep, { a, b });
    const bondDelta = branch === 'no-arithmetic-today' ? 1.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topicKind: 'grief-loss', threadId: t?.id, bondDelta };
  },
});

// ── THE COFFINS ──────────────────────────────────────────────────────
//
// MORNING, NOT DAWN, for `grief-the-last-glass`'s reason: headless.js skips
// `breakfast-fallout` entirely on a hidden morning, so a scene written for
// dawn would be unreachable on the only mornings it is about. And NOT ONE
// NAME in the pool, because the castle has not been given one — the whole
// point of the night is that it finds out at the funeral.
const COFFIN_LINES = {
  'counted-the-missing': [
    '{a} and {b} count who isn’t at breakfast. Nobody has been told who is dead.\n{a}: "There’s three not here."\n{b}: "And only one of them is dead. Probably."\n{a}: "We won’t know till this afternoon."',
    '{b} goes round the table in {bPos} head.\n{b}: "I can name who’s missing. I can’t tell you which one it is."\n{a}: "Nobody can. That’s the point."',
    '{a} counts the missing, and can’t get any further.\n{a}: "It’s one of them. Just one."\n{b}: "Unless it isn’t."',
    '{a} lists the missing faces out loud.\n{a}: "That’s everyone who isn’t here."\n{b}: "Now we wait."\n{a}: "I hate waiting."',
  ],
  'would-not-guess': [
    '{a} won’t guess which of the missing is dead.\n{b}: "Who do you think it is?"\n{a}: "I’m not doing that. We’ll find out."',
    '{b} wants to guess. {a} won’t.\n{b}: "Go on. Gut feeling."\n{a}: "No. Guessing who’s dead is grim."',
    '{a} keeps quiet all morning.\n{a}: "It’s not a game, guessing that."\n{b}: "Everything’s a game in here."\n{a}: "Not that."',
    '{a} changes the subject every time the coffins come up.\n{a}: "Can we talk about the mission instead?"\n{b}: "Fine."',
  ],
  'said-a-name-anyway': [
    '{b} says a name out loud, and {a} doesn’t like it.\n{b}: "I reckon it’s {c}."\n{a}: "Don’t. You don’t know that."\n{b}: "I just feel it."',
    '{b} guesses who is in the coffin.\n{b}: "It’s got to be {c}. {c} was a threat to them."\n{a}: "And if it’s not?"\n{b}: "Then I was wrong."',
    '{b} can’t help it.\n{b}: "{c}. I’d bet on {c}."\n{a}: "Keep your voice down."',
    '{b} names someone, and {a} feels sick hearing it.\n{b}: "My money’s on {c}."\n{a}: "That’s horrible, saying that."',
  ],
  'waited-badly': [
    '{b} can’t sit still waiting for the afternoon.\n{b}: "How long till we find out?"\n{a}: "Hours."\n{b}: "I can’t do hours."',
    '{a} watches {b} pace the hall.\n{a}: "Sit down, you’re making me nervous."\n{b}: "I can’t. Someone’s dead and we don’t even know who."',
    'The morning drags. {b} checks the time every few minutes.\n{b}: "It’s been ten minutes."\n{a}: "It’s been two."',
    '{b} keeps asking {a} who {bSub} thinks it is.\n{a}: "Stop asking me."\n{b}: "I can’t stop thinking about it."',
  ],
};

registerEvent({
  id: 'grief-the-coffins',
  family: FAMILY,
  window: 'morning',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'intuition', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _hiddenLastNight(ctx.ep) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-coffins');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'counted-the-missing': 0.3 + (sa.mental / 10) * 0.25,
      'would-not-guess': 0.2 + (sa.temperament / 10) * 0.3,
      'said-a-name-anyway': 0.15 + (sb.boldness / 10) * 0.35,
      'waited-badly': 0.15 + ((10 - sb.temperament) / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'counted-the-missing';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'would-not-guess' ? 'would not put a name to who was missing'
      : branch === 'said-a-name-anyway' ? 'guessed out loud at who was under which lid'
        : branch === 'waited-badly' ? 'could not get through the morning to the afternoon'
          : 'counted who was not at breakfast and got no further';
    const note = lineFor(COFFIN_LINES[branch],
      'grief-the-coffins|' + branch + '|' + ctx.ep,
      // THE NAME A GUESS REACHES FOR: one of the people not at breakfast.
      { a, b, c: ((_lastRound(ctx.ep)?.variantData?.coffins || [])
        .find(n => n !== a && n !== b)) || 'somebody' });
    // Guessing out loud at a morning like this costs the pair something; the
    // rest of it draws them together.
    const bondDelta = branch === 'said-a-name-anyway' ? -0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // NO NAME ON THE RECORD EITHER. The castle has not been told, and a scene
    // record carrying the victim is one screen away from printing it.
    return { branch, pair: [a, b], speaker: a, respondent: b,
      victim: null, topic: null, topicKind: 'grief-loss', threadId: t?.id, bondDelta };
  },
});

// ── IN THIS ROOM ─────────────────────────────────────────────────────
//
// The castle is never told HOW, so no line here may say a murder happened at
// the dinner table. What the room has is the evening itself: they were all in
// it, all night, and one of them is gone out of the middle of it. Every
// branch is that fact and the different ways of failing to do anything with
// it — which, on the night the murder really did happen in front of them, is
// the format's cruellest available scene.
const IN_THIS_ROOM_LINES = {
  'we-were-all-here': [
    'Nobody left the room last night, and {v} is gone anyway.\n{a}: "We were all here. The whole evening."\n{b}: "Then how?"\n{a}: "One of us did it in front of all of us."',
    '{a} can’t get over it.\n{a}: "It happened right under our noses."\n{b}: "At the table. While we were talking."\n{a}: "While we were talking."',
    '{b} goes cold thinking about it.\n{b}: "Whoever did it was sat right next to us."\n{a}: "Laughing at our jokes."',
    '{a} and {b} look at each other.\n{a}: "It could’ve been you."\n{b}: "It could’ve been you."\nNeither of them laughs.',
  ],
  'went-round-the-evening': [
    '{a} goes back over the whole evening with {b}.\n{a}: "Who got up? Who went to the loo?"\n{b}: "Nobody. Nobody left."\n{a}: "Then I’m missing something."',
    '{a} and {b} rebuild the evening minute by minute.\n{b}: "{v} was laughing at about ten."\n{a}: "And at eleven?"\n{b}: "I can’t remember."',
    '{a} can’t find a gap in the evening anywhere.\n{a}: "I’ve been through it five times."\n{b}: "Then they’re good. Really good."',
    '{b} goes through who sat where.\n{b}: "{v} was there. You were there. I was here."\n{a}: "And the person next to {v}?"',
  ],
  'stopped-looking': [
    '{b} puts the evening down rather than go through it again.\n{b}: "I’m not doing it again. It gets us nowhere."\n{a}: "Fine. But I’m not letting it go."',
    '{a} wants to go through it again. {b} won’t.\n{b}: "We’ve done this. Leave it."\n{a}: "Alright. For now."',
    '{b} is tired of going over it.\n{b}: "We were all there and none of us saw it. That’s the answer."\n{a}: "That’s not an answer."',
    '{a} and {b} give up on the evening.\n{a}: "We’re never going to work it out."\n{b}: "Not like this."',
  ],
  'looked-round-the-table': [
    '{a} looks at every face at the table, one at a time.\n{a} (to camera): "One of these people sat next to {v} all night and did it. I looked at every single one of them."',
    '{a} watches the table at breakfast very carefully.\n{a}: "Somebody here did it in front of us."\n{b}: "Stop staring. People are noticing."\n{a}: "Good."',
    '{a} goes round the table with {aPos} eyes.\n{a} (to camera): "Somebody had a really good evening last night. I want to know who."',
    '{a} keeps looking at the same few people.\n{b}: "Who are you looking at?"\n{a}: "Everyone. I’m looking at everyone."',
  ],
};

registerEvent({
  id: 'grief-in-this-room',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'temperament', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _plainSightLastNight(ctx.ep) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-in-this-room');
    const [a, b] = ctx.actors;
    const night = _plainSightLastNight(ctx.ep);
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'we-were-all-here': 0.35,
      'went-round-the-evening': 0.15 + (sa.mental / 10) * 0.3,
      'stopped-looking': 0.15 + (sb.temperament / 10) * 0.25,
      'looked-round-the-table': 0.15 + (sa.intuition / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'we-were-all-here';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'went-round-the-evening' ? 'took the whole evening apart and found nothing missing from it'
      : branch === 'stopped-looking' ? 'put the evening down rather than go through it again'
        : branch === 'looked-round-the-table' ? 'looked at every face at that table on purpose'
          : 'nobody left that room all evening and somebody is gone anyway';
    // `{v}` IS ONLY IN TWO OF THE POOLS, and `lineFor` leaves an unused
    // substitution alone — but the victim is public on this night (the castle
    // is told at breakfast like any other murder), so naming them is allowed
    // here in a way it is not on a coffin morning.
    const note = lineFor(IN_THIS_ROOM_LINES[branch],
      'grief-in-this-room|' + branch + '|' + ctx.ep, { a, b, v: night ? night.victim : a });
    const bondDelta = branch === 'looked-round-the-table' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      victim: night ? night.victim : null, topic: night ? night.victim : null,
      topicKind: 'grief-loss', threadId: t?.id, bondDelta };
  },
});

// ── THE OTHER CHAIR ──────────────────────────────────────────────────
//
// A death match is the only murder the castle WATCHES HAPPEN. Everything in
// this scene is public by construction: who was called, who got up, who was
// still sitting there at the last card. The one thing the room does not know
// is that the Traitors chose the four and chose them around a name that is
// having toast this morning.
//
// It is also the only grief scene in the file where the pair can be talking
// about somebody in the room. `_wonTheMatch` is a living player the castle has
// every reason to look at and no reason at all to suspect, which is the whole
// scene and the reason the channel in js/tr/murder-variants.js is priced at
// the bottom of the file.
function _deathMatchLastNight(ep) {
  const rounds = gs?.tr?.rounds || [];
  const round = rounds[rounds.length - 1];
  if (!round || round.ep !== ep - 1 || round.variant !== 'death-match') return null;
  const d = round.variantData;
  if (!d || !round.murdered) return null;
  const winner = (d.finalists || []).find(n => n !== round.murdered) || null;
  return { victim: round.murdered, winner, players: d.players || [], safe: d.safe || [] };
}

const OTHER_CHAIR_LINES = {
  'cannot-stop-looking': [
    '{a} can’t stop looking at {w}, the one who got up from the card table.\n{a}: "{w} walked away from that."\n{b}: "Somebody had to."\n{a}: "I know. It’s just strange to look at."',
    '{a} watches {w} eat breakfast like nothing happened.\n{a}: "How is {w} so calm?"\n{b}: "What else can you do?"',
    '{a} and {b} both keep glancing at {w}.\n{b}: "Stop looking."\n{a}: "You’re looking too."',
    '{a} can’t get last night out of {aPos} head.\n{a}: "{w} turned that card over and just breathed."\n{b}: "I’d have been sick."',
  ],
  'it-was-a-card': [
    '{b} keeps saying it was only a card game.\n{b}: "It was a card. That’s all it was. Luck."\n{a}: "Someone still died."\n{b}: "I know. But it was luck."',
    '{b} won’t read anything into it.\n{b}: "Don’t make it mean something. It was a draw."\n{a}: "Everything means something in here."',
    '{a} wants to talk about the card game. {b} doesn’t.\n{b}: "Luck of the draw. Leave it."\n{a}: "Fine."',
    '{b} shrugs it off.\n{b}: "Could’ve been any of them. It was just cards."\n{a} (to camera): "{b} keeps saying it was just cards. I’m not sure it was."',
  ],
  'who-picked-the-four': [
    '{a} and {b} want to know who chose the four players.\n{a}: "The Traitors picked those four."\n{b}: "So why those four?"\n{a}: "That’s what I keep asking."',
    '{b} thinks the choice of four is the real clue.\n{b}: "Forget the cards. Who put those four at the table?"\n{a}: "The Traitors."\n{b}: "Exactly. So who’d want those four in trouble?"',
    '{a} goes through the four names.\n{a}: "What have those four got in common?"\n{b}: "They were all loud at the last table."\n{a}: "That’s it. That’s it."',
    '{a} isn’t interested in the cards.\n{a}: "I want to know who picked the four of them."\n{b}: "We’ll never know that."\n{a}: "We might."',
  ],
  'would-you-have-drawn': [
    '{a} plays the last round again over breakfast.\n{a}: "Would you have drawn, or stuck?"\n{b}: "Drawn. No question."\n{a}: "Then you’d be gone."',
    '{b} and {a} argue about the last hand.\n{b}: "I’d have stuck."\n{a}: "You’d have panicked."\n{b}: "Probably."',
    '{a} can’t stop replaying it.\n{a}: "One more card. That’s all it was."\n{b}: "Don’t. It makes it worse."',
    '{a} asks {b} what {bSub} would have done.\n{b}: "Honestly? I’d have frozen."\n{a}: "Me too."',
  ],
  'was-in-it': [
    '{a} was at the card table last night and is still shaking.\n{b}: "You okay?"\n{a}: "I was one card away. One."\n{b}: "But you’re here."',
    '{a} sat in that chair and turned cards over, and survived.\n{a}: "I didn’t sleep."\n{b}: "I’m not surprised."\n{a}: "I keep seeing the last card."',
    '{b} asks {a} what it was like at the table.\n{a}: "Horrible. Everyone just watching."\n{b}: "I’m glad it wasn’t you."\n{a}: "It nearly was."',
    '{a} was in it, and won’t talk about it much.\n{a}: "I got lucky. That’s all."\n{b}: "Lucky’s enough."',
  ],
};

registerEvent({
  id: 'grief-the-other-chair',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // `grief-two-chairs`' weight and for its reason: one morning a season at
    // most, so the number decides whether this is THE scene of that morning.
    return _deathMatchLastNight(ctx.ep) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-other-chair');
    const [a, b] = ctx.actors;
    const night = _deathMatchLastNight(ctx.ep);
    const seated = night ? night.players : [];
    const inIt = seated.includes(a) || seated.includes(b);
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'cannot-stop-looking': 0.28 + (sa.intuition / 10) * 0.3,
      'it-was-a-card': Math.max(0.1, 0.42 - (sb.strategic / 10) * 0.28),
      'who-picked-the-four': 0.16 + ((sa.mental + sb.strategic) / 20) * 0.4,
      'would-you-have-drawn': 0.2 + ((10 - sa.temperament) / 10) * 0.2,
      // ONLY WHEN ONE OF THEM PLAYED IT. Scored to zero otherwise rather than
      // left out of the table, so the pool cannot be reached by a pair with
      // nothing to say and the branch stays honest about who is speaking.
      'was-in-it': inIt ? 0.9 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'cannot-stop-looking';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    // The speaker of a `was-in-it` scene is the one who actually sat down.
    const first = branch === 'was-in-it' && !seated.includes(a) ? b : a;
    const second = first === a ? b : a;
    const sceneWhy = branch === 'it-was-a-card' ? 'insisted the card game was only a card game'
      : branch === 'who-picked-the-four' ? 'asked who chose the four names'
        : branch === 'would-you-have-drawn' ? 'played the last round again over breakfast'
          : branch === 'was-in-it' ? 'had been at that table'
            : 'could not stop looking at the one who got up';
    const note = lineFor(OTHER_CHAIR_LINES[branch],
      'grief-the-other-chair|' + branch + '|' + ctx.ep,
      { a: first, b: second, w: (night && night.winner) || 'the winner' });
    const bondDelta = branch === 'it-was-a-card' ? 0.5 : 1;
    api.addBond(first, second, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [first, second], { source: sceneWhy, seed: note });
    return { branch, pair: [first, second], speaker: first, respondent: second,
      victim: night ? night.victim : null, topic: night ? night.victim : null,
      topicKind: 'grief-loss', threadId: t?.id, bondDelta };
  },
});
