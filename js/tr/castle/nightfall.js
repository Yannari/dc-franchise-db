// ══════════════════════════════════════════════════════════════════════
// tr/castle/nightfall.js — the castle after the table, and after the
// conclave, and before anybody knows what the conclave decided
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS. `night` is the whole of the `post-banishment` phase,
// it is budgeted 2-4 scenes, and Task 7 stage 1 measured it at **1.31 scenes
// an episode** across SEVEN registered events — 44% of its own minimum, and
// the thinnest pool of any window in the game. It was allocated +5. This file
// is those five.
//
// ── WHERE IN THE NIGHT THIS RUNS, WHICH DECIDES EVERYTHING BELOW ──────
//
// `playTraitorsSeason` (js/tr/headless.js) runs, in this order:
//
//     runCastlePhase('roundtable-scramble')   <- after-table
//     _night(ep)                              <- the conclave AND the murder
//     shieldEvidence / expireShields / settleDaggers
//     runCastlePhase('post-banishment')       <- THIS FILE
//
// So by the time these five events fire the murder has already been resolved
// and written onto tonight's round record. THE CASTLE DOES NOT KNOW THAT. The
// room finds out at breakfast, which is what the `dawn` window is for, and a
// night scene that referred to it would hand the whole cast a fact none of
// them has. Nothing in this file reads `round.murdered`, `round.murderTarget`,
// `round.murderBallots`, `secondVictim` or the conclave's `target`, and the
// one event that reads the turret at all reads only WHO ARGUED WITH WHOM.
//
// ── THE OBSERVER RULE, STATED ONCE AND ENFORCED IN ONE WEIGHT ─────────
//
// `night-overruled-in-the-turret` is the only event here built on Traitor-only
// material (`gs.tr.conclaveTension`), and its `weight()` returns 0 unless the
// acting player is on the pact AND HAS BEEN SHOWN every other person in the
// scene. Not "a Traitor is present": all of them, and by knowledge rather than
// by truth. A pact scene with a Faithful standing in it is a Faithful being
// handed turret knowledge through the one channel the belief gate does not
// watch, and the gate watches `learn()` rather than prose, so this has to be a
// precondition and not a carefully-worded sentence. The knowledge-not-truth
// half is not a nicety either: the first draft asked whether everybody IS a
// Traitor, and PROBE B in tests/tr-castle.test.js reddened on it within the
// hour. See the long note on that weight().
//
// The other four are built out of facts the whole castle watched happen: who
// was banished, who wrote whose name down, and that the sun went down. They
// can convene anybody.
//
// ── WHAT IS NOT WRITTEN HERE ──────────────────────────────────────────
//
// `setEmotionalState` is deliberately absent. `emotionalOverrideFor`
// (js/tr/state.js) keeps an override live while `o.ep >= ep`, and the next
// thing to read it is the NEXT episode's windows, at `ep + 1`, where the test
// fails — so an override written in this window is superseded before anything
// reads it. That is a write with no reader, which is the defect class this
// plan keeps finding rather than a consequence. The `after-table` events
// (js/tr/castle/consequences.js) write it instead, one window earlier, where
// three shipped night events read it back through `ctx.state`.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue, arcAdvanceCiting } from './effects.js';
import { alignmentAt } from '../roles.js';
import { peopleLost } from '../state.js';
import { findOpenThread } from '../threads.js';
// A PURE READ of what one player has been shown about another — never of what
// anybody IS. See the observer gate on `night-overruled-in-the-turret`.
import { knowsAlignmentOf } from '../deduction.js';
// The same reads the after-table library uses, imported rather than copied.
// A second copy of `table()` would drift from this one the first time the
// round record grows a field, and both windows are asking the same question
// about the same night.
import { table, votersAgainst, ballotOf, namesList, line, forkOn } from './consequences.js';

function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }



/**
 * Tonight's turret disagreements, as the pact itself remembers them.
 *
 * `gs.tr.conclaveTension` is written by js/tr/murder.js as
 * `{ ep, winner, loser, target, theirTarget }` — one entry per Traitor whose
 * argument did not carry the room. THE TARGETS ARE DELIBERATELY NOT READ BY
 * ANY CALLER BELOW. They are the murder, and the murder is tomorrow's news;
 * what a scene here is entitled to is the ARGUMENT — who pushed, who gave way
 * — which is a fact about the three of them rather than about the castle.
 */
function tensionTonight(ctx) {
  return (gs.tr?.conclaveTension || []).filter(t => t && t.ep === ctx.ep
    && t.winner && t.loser
    && ctx.living?.includes(t.winner) && ctx.living?.includes(t.loser));
}

// ══════════════════════════════════════════════════════════════════════
// NIGHT 1. OVERRULED IN THE TURRET — the pact is a faction with a
//    history, and tonight it has a date on it
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `gs.tr.conclaveTension`, and it is the reason that ledger's own
// docblock exists — "by episode 8 there is not a set of three Traitors but a
// faction with a history, and the endgame betrayal has a DATE attached rather
// than a schedule". Nothing in the castle pool had ever read it. This is the
// scene that puts the date on it.
//
// `rare: true`, and honestly so: it needs a disagreement, tonight, between two
// people the sampler convened who are both on the pact. Guard 2 exists so a
// narrow gate can still be seen, and this one is not load-bearing for the
// window's budget — the four broad events below are.
const OVERRULED = {
  'swallowed-it': [
    '{loser} lost the argument upstairs and said nothing about it afterwards, to {winner} or to anybody.',
    '{winner} got {winner}’s way. {loser} agreed, in the end, and did not make {winner} work for the agreeing.',
    '“Fine,” {loser} had said, and meant it, and came down the stairs behind {winner} looking exactly as usual.',
    '{loser} had a better argument and let {winner} have the room, which cost {loser} something to do quietly.',
    'Whatever {loser} had wanted, {winner} wanted otherwise, and by the time they came down it was settled.',
  ],
  'pressed-it': [
    '{loser} would not let it go. Long after it was decided, {loser} was still putting it to {winner}.',
    '“You didn’t listen,” {loser} said to {winner}, twice, on the stairs and again at the bottom of them.',
    '{winner} had won and {loser} kept relitigating it, which {winner} found tiring and slightly worrying.',
    '{loser} made {winner} defend the decision three separate times before either of them went to bed.',
    'It was over. {loser} carried on having it with {winner} anyway, in a corridor, quietly, at length.',
  ],
  'made-a-condition': [
    '{loser} gave way to {winner} and attached a price to giving way, which {winner} accepted too quickly.',
    '“You had this one,” {loser} said to {winner}. “I want the next one.” {winner} said yes.',
    '{loser} lost the argument and left with a promise about the next one, which is how a faction starts keeping accounts.',
    '{winner} bought the agreement rather than winning it, and both of them knew which had happened.',
    '“Then we do it my way after,” {loser} said. It was not a request and {winner} did not treat it as one.',
  ],
  'turned-cold': [
    '{loser} stopped talking to {winner} somewhere on the stairs and had not started again by lights out.',
    '{winner} said something ordinary to {loser} in the corridor and got an answer three words long.',
    'Whatever the two of them had been before tonight, {loser} came down those stairs a colder version of it.',
    '{loser} was perfectly civil to {winner} and would not look at {winner} once while being it.',
    'The argument had ended an hour ago. {loser} was still not over it, and {winner} could see that.',
  ],
  'filed-it': [
    '{loser} lost that argument and spent the walk back to the room deciding what losing it was worth.',
    'Nobody had to see {loser}’s face on the stairs, which was fortunate, because {loser} had stopped managing it.',
    '{loser} went over the argument again on {loser}’s own and came out of it with the same answer and less patience.',
    'It is a small thing to be overruled once. {loser} was no longer sure it had been once.',
    '{loser} put it away carefully, the way people put away things they intend to take out again.',
    'The corridor was empty and {loser} used it to stop being agreeable for about a minute.',
    '{loser} counted, alone, how many times it had gone the other way, and did not like the total.',
    'There was no one to say it to, so {loser} said nothing, and remembered it exactly.',
  ],
};

registerEvent({
  id: 'night-overruled-in-the-turret',
  family: 'cover',
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  // A disagreement, tonight, between two people the sampler convened who are
  // both on the pact. See guard 2 in js/tr/events.js.
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'strategic', 'boldness', 'loyalty'],
    alignment: ['original-traitor', 'recruited-traitor'],
    relationship: ['close-ally', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    // ── THE OBSERVER GATE: THE PACT IS KNOWLEDGE, NOT TRUTH ──────────────
    //
    // The first draft of this read `ctx.actors.every(n => isTraitor(n, ep))`,
    // and PROBE B in tests/tr-castle.test.js caught it inside an hour: with the
    // turret never shown, flipping the PARTNER's hidden alignment moved this
    // event's weight from 0 to 3. That is an event reading ground truth about
    // somebody else, which is the exact defect the three ground-truth probes
    // exist for, and it does not stop being one because the scene it produces
    // would have been observer-safe.
    //
    // The correct question is the one `cover-suspect-own-ally` already asks:
    // does the acting player KNOW? `isTraitor` is read for the actor's own role
    // — self-knowledge, always allowed — and everybody else in the scene has to
    // be somebody that player has been shown, through `knowsAlignmentOf`. On a
    // night where the turret has never been opened that is false whoever the
    // other person really is, so both arms of PROBE B weight 0; once it has,
    // the pact reaches its own scene, which is what PROBE B's counterpart arm
    // requires. Same answer in every real season, honest gate.
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!a) return 0;
    if (ctx.actors.some(n => n !== a && !knowsAlignmentOf(a, n, ctx.ep))) return 0;
    const rows = tensionTonight(ctx);
    if (!rows.length) return 0;
    // And the disagreement has to be about somebody who is standing here.
    // 8, NOT 3, AND THE NUMBER WAS MEASURED RATHER THAN CHOSEN — twice.
    //
    // At 3 this event drew ~200 paired firings in 4,200 seasons and split them
    // four ways, which put `turned-cold` at 37 against
    // tests/tr-castle-prose.test.js's floor of 40 — the point below which a
    // four-line pool stops being reliably seen and the variety floor stops
    // being a measurement. At 5 it cleared that and its rarest branch was
    // still 26 against the BRANCH floor in tr-castle-reachability.test.js
    // (24 per 3,200 seasons), which is a two-firing margin on a count whose
    // own resampling noise is larger than the margin — the knife-edge shape
    // that file spends four paragraphs refusing to ship.
    //
    // THE HONEST FIX FOR A BRANCH NOBODY SEES IS MORE FIRINGS OF THE EVENT,
    // not a branch fewer. This is the only scene in the whole pool that reads
    // `conclaveTension`, and that ledger's own docblock is the argument for
    // the weight: "by episode 8 there is not a set of three Traitors but a
    // faction with a history, and the endgame betrayal has a DATE attached
    // rather than a schedule". A weight of 8 does not make this event common —
    // its gate still needs a disagreement tonight between two people the
    // sampler convened who have both been shown the turret — it makes it the
    // scene of the night on the nights it is available, which is what it is.
    return rows.some(t => ctx.actors.includes(t.loser) || ctx.actors.includes(t.winner)) ? 8 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'night-overruled-in-the-turret');
    const sceneWhy = 'carried an argument out of the turret and down the stairs';
    const rows = tensionTonight(ctx);
    const row = rows.find(t => ctx.actors.includes(t.loser) && ctx.actors.includes(t.winner))
      || rows.find(t => ctx.actors.includes(t.loser))
      || rows.find(t => ctx.actors.includes(t.winner))
      || rows[0];
    const loser = row.loser;
    const winner = row.winner;
    const both = ctx.actors.length === 2 && ctx.actors.includes(loser) && ctx.actors.includes(winner);
    const st = pStats(loser);
    if (!both) {
      const solo = ctx.actors.includes(loser) ? loser : winner;
      const soloNote = line(OVERRULED['filed-it'], 'night-overruled-in-the-turret',
        'filed-it', ctx.ep, { loser: solo });
      const t = arcContinue(api, 'cover', [solo], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'filed-it', actor: solo, threadId: t.thread?.id, cited: t.cited, bondDelta: 0 };
    }
    // FLAT FLOORS ON ALL FOUR, for the same measured reason as the weight
    // above. Scored purely on stats, `made-a-condition` took 13 of 86 paired
    // firings and `turned-cold` 28 — a 2.2x spread across four branches of one
    // event, which puts the thin end under the branch floor while the event as
    // a whole is perfectly healthy. The floors are what even them out; the
    // stat terms still swing each branch by about a third of its own score, so
    // WHICH of the four a given player takes is still a fact about that player.
    const branch = forkOn(rng, {
      'swallowed-it': (st.temperament / 10) * 0.3 + (st.loyalty / 10) * 0.2 + 0.5,
      'pressed-it': (1 - st.temperament / 10) * 0.3 + (st.boldness / 10) * 0.15 + 0.5,
      'made-a-condition': (st.strategic / 10) * 0.3 + 0.55,
      'turned-cold': (1 - st.social / 10) * 0.25 + (1 - st.loyalty / 10) * 0.15 + 0.5,
    });
    const note = line(OVERRULED[branch], 'night-overruled-in-the-turret', branch, ctx.ep,
      { winner, loser });
    const bondDelta = branch === 'swallowed-it' ? 0.5
      : branch === 'pressed-it' ? -1.5
        : branch === 'made-a-condition' ? 1 : -2.5;
    api.addBond(loser, winner, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'cover', [loser, winner], ctx.ep, note,
      { source: sceneWhy });
    // The person who lost the argument is the one carrying the scene, on every
    // paired branch — including the two where they say almost nothing.
    return { branch, pair: [loser, winner], speaker: loser, respondent: winner,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// NIGHT 2. THE SEAT THEY HAD — a room with somebody's things still in it
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: tonight's banishment, and tonight's ballots, which say whether
// the person having this reaction is one of the people who did it. That second
// half is what keeps this from being the same scene as `grief-nobody-sleeps`:
// that event is a person counting empty beds in general, this is a person in a
// specific room that had somebody in it this morning, with their own ballot to
// account for.
const SEAT_THEY_HAD = {
  'moved-their-things': [
    '{a} and {b} put {gone}’s things by the door because leaving them out felt worse than moving them.',
    'Somebody had to do it, and it turned out to be {a} and {b}, at midnight, saying very little.',
    '{a} folded {gone}’s coat and {b} did not offer to help, because there was nothing to help with.',
    '{a} and {b} tidied a room neither of them slept in and did not discuss why they were doing it.',
    'It took four minutes to make {gone}’s side of the room look like nobody had ever been in it.',
  ],
  'talked-about-them': [
    '{a} and {b} stayed up telling each other things {gone} had said this week that neither had thought about at the time.',
    '“{gone} told me that on the first night,” {b} said, and {a} had heard the same story with a different ending.',
    '{a} and {b} compared what {gone} had told each of them, and the two accounts did not entirely match.',
    'They ended up laughing about {gone}, {a} and {b}, which surprised both of them and then did not.',
    '{a} wanted to talk about {gone} and {b} let {a}, for a long time, and did not steer it anywhere useful.',
  ],
  'could-not': [
    '{b} tried to talk about {gone} and {a} would not, and the room went quiet for a long time.',
    '“Not tonight,” {a} said to {b}, about {gone}, and {b} did not push it, and the silence lasted.',
    '{a} lay there while {b} said {gone}’s name and did not answer any of it.',
    '{b} got as far as “when {gone} said —” and {a} said no, once, and that was the end of the evening.',
    '{a} was not going to do this in front of {b} and {b} worked that out about a sentence too late.',
  ],
  'own-ballot': [
    '{a} told {b}, in the dark, that {a} had written {gone}’s name, and had not said so to anybody all evening.',
    '“I wrote it,” {a} said to {b}, hours after it stopped mattering, because {a} could not go to sleep holding it.',
    '{a} confessed the ballot to {b} at lights-out, and {b} said the useful thing rather than the kind one.',
    '{a} had been carrying {a}’s own slate around all night and finally put it down in front of {b}.',
    '“{who} and me,” {a} said. “That is who did it.” {b} had already worked out the first part.',
  ],
  'on-their-own': [
    '{a} lay in a room that had one more person in it this morning and did the arithmetic anyway.',
    'Nobody to say it to, so {a} said nothing, and thought about {gone} until it got light enough to stop.',
    '{a} could hear how much less noise the corridor made with {gone} not in it.',
    'There was a coat on a hook that nobody was going to come back for, and {a} kept not looking at it.',
    '{a} went over the whole day and could not find the point where it stopped being avoidable.',
    'It is easier at night to admit that {a} is not entirely sure {a} did the right thing about {gone}.',
    '{a} slept badly in a room that had got quieter, and could not have told anybody which part did it.',
    'Alone, {a} finally let it be sad rather than strategic, for about ten minutes, and then stopped.',
    '{a} had voted, and the vote had worked, and {a} lay there discovering those were separate feelings.',
    'The castle is a different building at night with {gone} out of it, and {a} could not say how.',
    '{a} kept the light off and did the whole thing in the dark, which made it shorter.',
    'Somebody had left one of {gone}’s cups on the side. {a} thought about that cup for longer than a cup deserves.',
    '{a} rehearsed what {a} would say about {gone} tomorrow and hated every version of it.',
    'It is one thing to want somebody gone and another to lie in a quiet building afterwards.',
    '{a} tried to remember the last ordinary thing {gone} had said to {a} and could not get it exactly.',
    'There was nobody to be honest with, so {a} was honest with the ceiling for a while.',
  ],
};

registerEvent({
  id: 'night-the-seat-they-had',
  family: 'grief',
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'temperament', 'strategic'],
    knowledge: ['witnessed'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    // A banishment tonight. `peopleLost` is the honest source for "the castle
    // has lost somebody" (js/tr/state.js), but this scene is about ONE person
    // and needs the name, so it gates on the round.
    const round = table(ctx);
    if (!round) return 0;
    return peopleLost(gs) >= 1 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'night-the-seat-they-had');
    const sceneWhy = 'spent lights-out in a room that had one more person in it this morning';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const gone = round.banished;
    const st = pStats(a);
    if (!b) {
      const soloNote = line(SEAT_THEY_HAD['on-their-own'], 'night-the-seat-they-had',
        'on-their-own', ctx.ep, { a, gone });
      const solo = arcContinue(api, 'grief', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'on-their-own', actor: a, subject: gone,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const wroteIt = ballotOf(round, a) === gone;
    const others = votersAgainst(round, gone, ctx.living).filter(n => n !== a);
    const branch = forkOn(rng, {
      'moved-their-things': (st.loyalty / 10) * 0.4 + (st.temperament / 10) * 0.3,
      'talked-about-them': (st.social / 10) * 0.5 + 0.2,
      'could-not': (1 - st.social / 10) * 0.5 + (1 - st.temperament / 10) * 0.25,
      // Only available to somebody who actually wrote the name — the same
      // record rule the after-table library applies to its own guilt branches.
      'own-ballot': wroteIt ? (st.loyalty / 10) * 0.45 + (1 - st.temperament / 10) * 0.35 : 0,
    });
    const note = line(SEAT_THEY_HAD[branch], 'night-the-seat-they-had', branch, ctx.ep, {
      a, b, gone, who: namesList(others),
    });
    const bondDelta = branch === 'moved-their-things' ? 1.5
      : branch === 'talked-about-them' ? 2 : branch === 'could-not' ? -0.5 : 2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'grief', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: gone,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// NIGHT 3. WHAT WE SAY IN THE MORNING — the second closer this window
//    has ever had
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: an open testing story between these two. `night` already holds
// one closer for this family (`testing-night-scores-it`, which scores a test
// the tester ran); this is the other half of the same hour, where the two of
// them agree — or fail to agree — what the two of them are going to SAY
// tomorrow. A test settled by agreement and a test settled by catching
// somebody out are different endings and the pool held only the second.
const IN_THE_MORNING = {
  'agreed-a-line': [
    '{a} and {b} settled, in the dark, exactly what each of them is saying at breakfast, and it is the same thing.',
    'Last thing before sleep, {a} and {b} agreed the account. Not a lie — an agreed order of events.',
    '“Same version,” {b} said, and {a} said it back, and neither of them needed to write it down.',
    '{a} and {b} went through tomorrow morning twice and came out of it saying one thing between them.',
    'They ended the day agreeing on what the day had been, {a} and {b}, which is rarer here than it sounds.',
  ],
  'could-not-agree': [
    '{a} and {b} could not settle what to say in the morning and stopped trying somewhere around midnight.',
    '“Then we say different things,” {b} said to {a}, which is the worst available answer and the honest one.',
    '{a} wanted an agreed line and {b} would not give one, and both of them lay there knowing what that means.',
    'Two versions of the same evening went to bed in the same corridor, and neither {a} nor {b} liked it.',
    '{a} and {b} left it open, deliberately, because closing it would have meant one of them giving way.',
  ],
  'one-of-them-lied': [
    '{a} caught the seam in {b}’s account at lights-out, and {b} heard {a} catch it.',
    'It fell apart in the dark. {b} said one thing too many and {a} stopped agreeing with any of it.',
    '“You told me that differently on Tuesday,” {a} said, and the rest of the night went the way that goes.',
    '{a} had been waiting all day for the part of {b}’s story that would not hold, and it arrived at midnight.',
    '{b} tried the account on {a} one last time and it did not survive being said out loud.',
  ],
  'settled-it': [
    '{a} stopped testing {b} at lights-out and told {b} so, which took more from {a} than the testing had.',
    '“I’m done checking,” {a} said to {b}. “Whatever you are, I’m not going to find it like this.”',
    '{a} had run out of ways to catch {b} and decided the absence of a seam was itself an answer.',
    'It ended quietly. {a} put the whole thing down and told {b} it was down, and {b} believed {a}.',
    '{b} passed the last one without knowing it was the last one, and {a} did not tell {b} that part.',
  ],
};

registerEvent({
  id: 'night-what-we-say-in-the-morning',
  family: 'testing',
  window: 'night',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['strategic', 'intuition', 'loyalty', 'social'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread('testing', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'night-what-we-say-in-the-morning');
    const sceneWhy = 'agreed, or failed to agree, what the two of them say at breakfast';
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      'agreed-a-line': (sb.loyalty / 10) * 0.4 + Math.max(0, bond) / 10 * 0.4,
      'could-not-agree': (1 - sb.social / 10) * 0.45 + Math.max(0, -bond) / 10 * 0.3,
      'one-of-them-lied': (sa.intuition / 10) * 0.45 + (1 - sb.loyalty / 10) * 0.4,
      'settled-it': (1 - sa.strategic / 10) * 0.35 + (sa.temperament / 10) * 0.35,
    });
    const note = line(IN_THE_MORNING[branch], 'night-what-we-say-in-the-morning', branch, ctx.ep,
      { a, b });
    const thread = findOpenThread('testing', [a, b]);
    const bondDelta = branch === 'agreed-a-line' ? 2
      : branch === 'could-not-agree' ? -1 : branch === 'one-of-them-lied' ? -2.5 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { cited } = arcAdvanceCiting(api, thread, ctx.ep, note, { source: sceneWhy });
    const outcome = branch === 'one-of-them-lied' ? 'test-exposed'
      : branch === 'settled-it' ? 'passed-clean' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread.id, cited, outcome, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// NIGHT 4. ONE VOTE AWAY — surviving a table you were on
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.ballots`. Somebody took a vote tonight and is still here,
// and both of those are public. `after-you-wrote-my-name` is the daylight
// version of this — a person going and asking. This is the version where it is
// too late to ask anybody anything, which is a different scene and is why the
// two do not share a branch set.
const ONE_VOTE_AWAY = {
  'counted-it': [
    '{a} told {b}, in the dark, exactly how many names it would have taken, and had the number ready.',
    '“{who},” {a} said to {b}. “That is who wrote it. I have been carrying that around since seven.”',
    '{a} went through the slate for {b} from memory and did not get a single name wrong.',
    '{b} asked {a} if {a} was all right and got an itemised answer instead of a yes.',
    '{a} said it out loud to {b} because saying it out loud made it smaller, slightly, for about a minute.',
  ],
  'asked-outright': [
    '“Were you one of them?” {a} asked {b}, at lights-out, when there is nothing left to lose by asking.',
    '{a} had held the question all evening and let it out in the dark, where {b} could not be watched answering it.',
    '“I’m going to ask once,” {a} said to {b}, “and then I’m going to sleep either way.”',
    '{a} asked the question straight and {b} answered it straight, and {a} still could not tell.',
    'It came out of {a} at the wrong end of the night, and {b} answered before {a} had finished it.',
  ],
  'let-it-lie': [
    '{a} had a whole conversation ready for {b} and decided, at the last second, not to have it.',
    '{b} waited for {a} to raise it. {a} did not raise it, and both of them noticed the not raising.',
    '“Goodnight,” {a} said to {b}, and that was all, and it took some doing.',
    '{a} decided that asking would cost more than knowing was worth, and went to sleep on that.',
    'There was a version of tonight where {a} said something to {b}. {a} did not take it.',
  ],
  'promised-nothing': [
    '{b} offered {a} something reassuring and {a} declined it, politely, which unsettled {b} more than a row.',
    '“Don’t promise me anything,” {a} said to {b}. “I’d rather know where I actually stand.”',
    '{b} said {a} was safe and {a} pointed out, without heat, that {b} does not get to decide that.',
    '{a} would not take the comfort, and {b} spent a while afterwards working out what that meant.',
    '“You said that last week too,” {a} said to {b}, and rolled over, and did not say anything else.',
  ],
  'awake-with-it': [
    '{a} lay there working out which of them it would have taken, and got a different answer twice.',
    'Nobody wrote {a}’s name enough times tonight. {a} spent the dark on the word "enough".',
    '{a} went through the slate in the dark until the names stopped being people and started being a total.',
    'It is a strange thing to survive by a margin nobody tells you. {a} could not stop estimating it.',
    '{a} was still awake at the point where being awake had stopped being about tonight at all.',
    'Somebody in this building wrote {a}’s name down today, and {a} had all night to think about who.',
    '{a} did the count, decided it was fine, and did the count again about twenty minutes later.',
    'Being one of the names is not the same as being the name. {a} lay there failing to find that comforting.',
  ],
};

registerEvent({
  id: 'night-one-vote-away',
  family: 'suspicion',
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['temperament', 'boldness', 'intuition', 'loyalty'],
    knowledge: ['witnessed'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a] = ctx.actors;
    return votersAgainst(round, a, ctx.living).length ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'night-one-vote-away');
    const sceneWhy = 'lay awake with a slate that had their own name on it';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const against = votersAgainst(round, a, ctx.living);
    const st = pStats(a);
    if (!b) {
      const soloNote = line(ONE_VOTE_AWAY['awake-with-it'], 'night-one-vote-away',
        'awake-with-it', ctx.ep, { a });
      const solo = arcContinue(api, 'suspicion', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'awake-with-it', actor: a,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const branch = forkOn(rng, {
      'counted-it': (st.intuition / 10) * 0.45 + (st.social / 10) * 0.3,
      'asked-outright': (st.boldness / 10) * 0.5 + (1 - st.temperament / 10) * 0.25,
      'let-it-lie': (1 - st.boldness / 10) * 0.45 + (st.temperament / 10) * 0.3,
      'promised-nothing': (1 - st.loyalty / 10) * 0.35 + (st.temperament / 10) * 0.35,
    });
    const note = line(ONE_VOTE_AWAY[branch], 'night-one-vote-away', branch, ctx.ep, {
      a, b, who: namesList(against),
    });
    const bondDelta = branch === 'counted-it' ? 1
      : branch === 'asked-outright' ? -0.5
        : branch === 'let-it-lie' ? -1 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'counted-it' ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// NIGHT 5. NOTHING STRATEGIC LEFT — the window's ordinary hour
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS ONE HAS ALMOST NO GATE, WHICH IS DELIBERATE AND IS THE WIDENING
// THE MEASUREMENT ASKED FOR. `night` drew 1.31 scenes an episode against a 2-4
// budget, and the reason was supply rather than schedule: five of the seven
// events registered there demand a specific pair state (a showmance, an open
// story of the right kind), so a solo draw or a cold pair ended the window
// outright — `runWindow` BREAKS on the first draw with nothing eligible, so
// one ineligible draw costs the whole rest of the night, not one scene.
//
// It is also the beat the tone contract asks for by name: "at least one
// warmth, humour or ordinary-life scene", and "a humorous scene still changes
// a relationship, reputation, emotional state or information path". All four
// branches move a bond and write a beat; `hollow` moves one down.
//
// It reads no round record at all, which is what makes it the one event in
// either window that works on night one, when there has been no table.
const NOTHING_LEFT = {
  ordinary: [
    '{a} and {b} talked about nothing at all for twenty minutes, which neither of them had done since the first night.',
    'Somebody’s terrible taste in music, at length, in a castle, at midnight. {a} started it and {b} made it worse.',
    '{a} and {b} discovered they had both been to the same appalling wedding, and that took up the rest of the evening.',
    'Not one word of it was about the game. {a} and {b} both noticed that afterwards and neither mentioned it.',
    '{b} was homesick and said so and {a} let it be about that, which is not nothing in here.',
  ],
  funny: [
    '{b} did an impression of the estate manager that was cruel and extremely accurate, and {a} had to leave the room.',
    '{a} and {b} got the giggles about something so small that neither could explain it afterwards.',
    'It took {b} four attempts to get the story out because {a} would not stop laughing at the first line.',
    '{a} laughed properly for the first time in days and {b} looked quietly pleased about having caused it.',
    'Two adults in a stone corridor, crying with laughter about a chair. {a} and {b} needed it more than they knew.',
  ],
  kind: [
    '{b} noticed {a} was not all right and stayed, without asking about it, until {a} was closer to all right.',
    '{a} did not have to say anything and {b} did not make {a}. That was the whole of the kindness.',
    '{b} made {a} eat something at half past eleven, which is the most anybody had done for {a} all week.',
    '{a} said thank you to {b} for something small and meant it disproportionately.',
    '{b} sat on the end of {a}’s bed and talked about nothing until {a} was tired enough to sleep.',
  ],
  hollow: [
    '{a} and {b} talked for twenty minutes and neither of them said one true thing, and both knew it.',
    'The conversation was pleasant and completely empty, and {a} came away feeling worse than before it.',
    '{b} was warm, and careful, and gave {a} nothing, and {a} noticed the shape of the nothing.',
    '{a} tried three times to make it a real conversation and {b} kept it exactly where {b} wanted it.',
    'It was the sort of goodnight two people say when neither of them intends to be honest tomorrow either.',
  ],
  alone: [
    '{a} read the same page of nothing four times and went to sleep without noticing.',
    'There is a point in the night where {a} stops playing anything and is just somebody in a cold room.',
    '{a} lay there listening to the building and did not think about the game once, which took effort.',
    '{a} wrote a whole letter home in {a}’s head and did not get past the first line of it.',
    'It was the first hour all day nobody wanted anything from {a}, and {a} spent it doing nothing at all.',
    '{a} thought about somebody at home for a while, which is not strategy and is most of what keeps people going.',
    'Nobody knocked. {a} had half hoped somebody would and was relieved when nobody did.',
    '{a} fell asleep with the light on, which is the most honest thing {a} did all day.',
  ],
};

registerEvent({
  id: 'night-nothing-strategic-left',
  family: 'trust',
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['social', 'loyalty', 'temperament', 'strategic'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    // The one thing it needs is that the day is over, which is what the window
    // is. Weighted below the gated events so it fills the window rather than
    // owning it.
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'night-nothing-strategic-left');
    const sceneWhy = 'had the one hour of the day with nothing in it';
    const [a, b] = ctx.actors;
    if (!b) {
      const soloNote = line(NOTHING_LEFT.alone, 'night-nothing-strategic-left',
        'alone', ctx.ep, { a });
      const solo = arcContinue(api, 'trust', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'alone', actor: a, threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      ordinary: (sa.social / 10) * 0.35 + 0.3,
      funny: (sb.social / 10) * 0.4 + (sb.boldness / 10) * 0.25,
      kind: (sb.loyalty / 10) * 0.4 + Math.max(0, bond) / 10 * 0.35,
      hollow: (sb.strategic / 10) * 0.35 + Math.max(0, -bond) / 10 * 0.4,
    });
    const note = line(NOTHING_LEFT[branch], 'night-nothing-strategic-left', branch, ctx.ep, { a, b });
    const bondDelta = branch === 'ordinary' ? 1
      : branch === 'funny' ? 1.5 : branch === 'kind' ? 2.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'hollow' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    // `funny` and `kind` are `{b}` doing something to `{a}`; the other two are
    // two people in a room, and the initiator carries them.
    const bDrives = branch === 'funny' || branch === 'kind' || branch === 'hollow';
    return { branch, pair: [a, b], speaker: bDrives ? b : a, respondent: bDrives ? a : b,
      threadId: thread?.id, cited, bondDelta };
  },
});
