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
  // NOT A LIBRARY ROW. A chalice night writes real tension into the same
  // ledger, but this scene's every line has the losers coming down the turret
  // stairs, and on that night nobody climbed them.
  return (gs.tr?.conclaveTension || []).filter(t => t && t.ep === ctx.ep
    && t.winner && t.loser && !t.library
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
    '{loser} lost the argument upstairs, and says nothing about it afterwards, to {winner} or to anybody.\n{loser} (to camera): "{winner} got {winnerPos} way. Fine. I’ll remember it."',
    '{winner} got {winnerPos} way. {loser} agreed in the end, and didn’t make {winner} work for it.\n{winner}: "We good?"\n{loser}: "We’re good."',
    '{loser} lets {winner} have it without a fight.\n{loser}: "Your call. I’m not going to argue on the stairs."\n{winner}: "Thank you."',
    'On the way down, {winner} waits for {loser} to say something. {loser} doesn’t.\n{winner} (to camera): "Too quiet. {loser} is never that quiet."',
    '{loser} goes along with {winner}, and swallows it.\n{loser} (to camera): "You pick your battles. That wasn’t the one."',
  ],
  'pressed-it': [
    '{loser} won’t let it go. Long after it was decided, {loser} is still putting it to {winner}.\n{loser}: "You didn’t listen to me."\n{winner}: "It’s done."\n{loser}: "You still didn’t listen."',
    '{loser} says it twice, on the stairs and again at the bottom of them.\n{loser}: "You didn’t listen."\n{winner}: "I heard you. I disagreed."',
    '{loser} keeps arguing in a whisper on the landing.\n{loser}: "This is a mistake."\n{winner}: "Keep your voice down."',
    '{loser} presses the point until {winner} snaps.\n{winner}: "Enough. It’s decided."\n{loser}: "By you."',
    '{loser} can’t leave it.\n{loser}: "When this goes wrong, I want you to remember I said so."\n{winner}: "Noted."',
  ],
  'made-a-condition': [
    '{loser} gives way to {winner}, and puts a price on it.\n{loser}: "You had this one. I want the next one."\n{winner}: "Fine."\n{loser} (to camera): "{winner} said yes too quickly."',
    '{loser} makes a deal on the stairs.\n{loser}: "Next time, it’s my choice. No arguments."\n{winner}: "Deal."',
    '{loser} agrees, on one condition.\n{loser}: "I go along with you tonight. You owe me."\n{winner}: "I owe you."',
    '{loser} sets terms.\n{loser}: "One for you, one for me. That’s how this works now."\n{winner} (to camera): "{loser} is keeping score. That’s dangerous."',
    '{loser} lets {winner} win, for a price.\n{winner}: "What do you want?"\n{loser}: "The next name."',
  ],
  'turned-cold': [
    '{loser} stops talking to {winner} somewhere on the stairs, and hasn’t started again by lights out.\n{winner}: "Night, then."\n{loser}: "Night."',
    '{winner} says something ordinary to {loser} in the corridor, and gets three words back.\n{winner}: "You alright?"\n{loser}: "Fine. Thanks. Night."',
    '{loser} goes cold on {winner}.\n{winner} (to camera): "I won the argument. I might have lost {loser}."',
    '{loser} walks past {winner} without a word.\n{winner}: "Seriously?"',
    '{loser} gives {winner} the silent treatment.\n{loser} (to camera): "I’m not speaking to {winnerObj}. Not tonight."',
  ],
  'filed-it': [
    '{loser} lost that argument, and spends the walk back to the room deciding what losing it was worth.\n{loser} (to camera): "I don’t get angry. I get even. Eventually."',
    'Nobody has to see {loser}’s face on the stairs, which is lucky, because {loser} has stopped managing it.\n{loser} (to camera): "I was overruled. I don’t like being overruled."',
    '{loser} lies in bed going over the argument.\n{loser} (to camera): "If it goes wrong, it’s not on me. I want that clear."',
    '{loser} makes a note of who sided with who in the turret.\n{loser} (to camera): "There’s a pecking order up there now. I’m not at the top of it."',
    '{loser} sits on the edge of the bed, still annoyed.\n{loser} (to camera): "We’re meant to be a team. It didn’t feel like one tonight."',
    '{loser} thinks about going it alone.\n{loser} (to camera): "If I have to, I can do this without them."',
    '{loser} files it away.\n{loser} (to camera): "One day that argument will matter. Not today."',
    '{loser} can’t sleep after the turret.\n{loser} (to camera): "Losing an argument up there feels like losing a vote down here."',
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
    '{a} and {b} put {gone}’s things by the door, because leaving them out feels worse.\n{a}: "Should we?"\n{b}: "Someone has to."',
    'Somebody has to do it, and it turns out to be {a} and {b}, at midnight, saying very little.\n{b}: "{gone} left {gonePos} book."\n{a}: "Put it on top."',
    '{a} folds {gone}’s jumper and hands it to {b}.\n{a}: "I can’t look at the bed."\n{b}: "I know."',
    '{a} and {b} clear {gone}’s side of the room.\n{b} (to camera): "Horrible. Like packing up after someone’s died."',
    '{a} and {b} pack {gone}’s things together.\n{a}: "It feels wrong."\n{b}: "It is wrong. We still have to do it."',
  ],
  'talked-about-them': [
    '{a} and {b} stay up telling each other things {gone} said this week.\n{b}: "{gone} told me that on the first night."\n{a}: "{gone} told me the same story. Different ending."',
    '{a} and {b} remember {gone}.\n{a}: "{gone} snored like a train."\n{b}: "I’ll miss it. Weirdly."',
    '{a} and {b} swap stories about {gone}.\n{b}: "Did {gone} ever tell you about the dog?"\n{a}: "Three times."',
    '{a} and {b} talk about {gone} in the dark.\n{a}: "{gone} was funny. Properly funny."\n{b}: "Yeah. {gone} was."',
    '{a} and {b} laugh about {gone}, then go quiet.\n{b} (to camera): "Talking about {gone} helped. A bit."',
  ],
  'could-not': [
    '{b} tries to talk about {gone}, and {a} won’t.\n{a}: "Not tonight."\n{b}: "Okay."\nThe silence lasts a long time.',
    '{a} turns over when {b} mentions {gone}.\n{a}: "Please. I just want to sleep."',
    '{b} wants to talk. {a} doesn’t.\n{b}: "Do you want to—"\n{a}: "No."',
    '{a} can’t talk about {gone}.\n{b} (to camera): "{a} is really hurting. I didn’t push it."',
    '{b} raises it once, and {a} shuts it down.\n{a}: "Tomorrow. Not tonight."',
  ],
  'own-ballot': [
    '{a} tells {b}, in the dark, something {aSub} hasn’t said all evening.\n{a}: "I wrote {gone}’s name."\n{b}: "I know. I heard."\n{a}: "I needed to say it out loud."',
    '{a} confesses to {b} hours after it stopped mattering.\n{a}: "I wrote it. I can’t sleep with that."\n{b}: "Then say it, and sleep."',
    '{a} whispers it to {b}.\n{a}: "It was me. One of the names."\n{b}: "You weren’t the only one."',
    '{a} can’t hold it in any longer.\n{a}: "I put {gone} out. I liked {goneObj}."\n{b}: "I know."',
    '{a} admits the vote to {b}.\n{a} (to camera): {cam:vote-cost}',
  ],
  'on-their-own': [
    '{a} lies in a room that had one more person in it this morning.\n{a} (to camera): {cam:few-left}',
    'Nobody to say it to, so {a} says nothing, and thinks about {gone} until it gets light.\n{a} (to camera): {cam:vote-cost}',
    '{a} stares at {gone}’s empty bed.\n{a} (to camera): "Somebody slept there last night. Now nobody does."',
    '{a} can’t sleep with {gone}’s bed empty.\n{a} (to camera): {cam:cant-sleep}',
    '{a} lies awake listening to how quiet the room has gone.\n{a} (to camera): {cam:after-table}',
    '{a} thinks about the first night, when every bed was full.\n{a} (to camera): {cam:few-left}',
    '{a} goes over the vote that emptied the bed.\n{a} (to camera): {cam:ballots}',
    '{a} lies in the dark missing {gone}.\n{a} (to camera): "I didn’t even get to say goodbye properly."',
    '{a} thinks about home.\n{a} (to camera): {cam:homesick}',
    '{a} turns {gone}’s pillow over, then feels daft about it.\n{a} (to camera): "Silly. I just didn’t want to look at the dent."',
    '{a} counts who is still sleeping in the castle.\n{a} (to camera): {cam:few-left}',
    '{a} goes over what {gone} said at the table.\n{a} (to camera): {cam:replay-week}',
    '{a} can’t switch off.\n{a} (to camera): {cam:cant-sleep}',
    '{a} lies awake, too tired to cry.\n{a} (to camera): {cam:after-table}',
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
        topic: gone, topicKind: 'seat-loss',
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
      topic: gone, topicKind: 'seat-loss',
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
    '{a} and {b} settle, in the dark, exactly what each of them will say at breakfast.\n{a}: "So we were together from dinner till bed."\n{b}: "From dinner till bed."',
    'Last thing before sleep, {a} and {b} agree the order of events.\n{b}: "Kitchen, then the fire, then up."\n{a}: "Kitchen, fire, up. Got it."',
    '{a} and {b} go over tomorrow’s story.\n{a}: "Say it back to me."\n{b}: "Dinner, fire, bed. Nothing else."',
    '{a} and {b} make sure their accounts match.\n{b} (to camera): {cam:story-hold}',
    '{a} and {b} agree on one version.\n{a}: "If anyone asks, that’s all that happened."\n{b}: "That’s all that happened."',
  ],
  'could-not-agree': [
    '{a} and {b} can’t settle what to say in the morning, and give up around midnight.\n{b}: "Then we say different things."\n{a}: "That’s the worst answer."\n{b}: "It’s the honest one."',
    '{a} and {b} disagree about the story.\n{a}: "We went up at eleven."\n{b}: "It was later than that."',
    '{a} and {b} argue in whispers.\n{a}: "We need the same answer."\n{b}: "We don’t remember the same night."',
    '{a} and {b} can’t get it straight.\n{a} (to camera): {cam:story-close}',
    '{a} and {b} leave it unresolved.\n{b}: "We’ll just tell the truth."\n{a}: "Which one?"',
  ],
  'one-of-them-lied': [
    '{a} catches the seam in {b}’s account at lights-out, and {b} hears {aObj} catch it.\n{a}: "Hang on. You said you were in the kitchen."\n{b}: "I was. Mostly."',
    'It falls apart in the dark. {b} says one thing too many.\n{a}: "That’s not what you said earlier."\n{b}: "Isn’t it?"',
    '{a} notices {b}’s story change.\n{a} (to camera): {cam:holding-info}',
    '{a} spots a gap in {b}’s account.\n{a}: "Where were you between ten and eleven?"\n{b}: "Around."',
    '{a} stops agreeing with {b}.\n{a}: "I’m not saying that at breakfast. It’s not true."',
  ],
  'settled-it': [
    '{a} stops testing {b} at lights-out, and says so.\n{a}: "I’m done checking. Whatever you are, I’m not going to find it like this."\n{b}: "Thank you. I think."',
    '{a} decides to trust {b}.\n{a}: "I believe you."\n{b}: "Finally."',
    '{a} lets it go.\n{a} (to camera): "I’ve been testing {b} for days. I’m tired of it."',
    '{a} calls a truce.\n{a}: "No more questions."\n{b}: "Deal."',
    '{a} tells {b} {aSub} trusts {bObj}.\n{b} (to camera): "That took a lot for {a} to say."',
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
    '{a} tells {b}, in the dark, exactly how close it was.\n{a}: "{who}. That’s who wrote my name. I’ve been carrying that since the table."\n{b}: "One more and you’d be gone."\n{a}: "I know."',
    '{a} has the number ready.\n{a}: "One vote. That’s all it would have taken."\n{b}: "But it didn’t."',
    '{a} goes through the votes with {b}.\n{a}: "{who}. Remember them."\n{b}: "I will."',
    '{a} can’t stop counting.\n{a}: "One more name. One."\n{b}: "You’re still here."',
    '{a} tells {b} {aSub} knows who.\n{a} (to camera): {cam:ballots}',
  ],
  'asked-outright': [
    '{a} asks {b} at lights-out, when there’s nothing left to lose.\n{a}: "Were you one of them?"\n{b}: "No."\n{a}: "Swear?"\n{b}: "I swear."',
    '{a} has held the question all evening, and lets it out in the dark.\n{a}: "Did you write me?"\n{b}: {say:deny}',
    '{a} asks straight.\n{a}: "Tell me the truth. Were you close to writing me?"\n{b}: "Close. Not quite."',
    '{a} tests {b} in the dark.\n{a}: "If I’d asked you yesterday, would you have said my name?"\n{b}: "No."',
    '{a} wants to know.\n{a}: "Who were you on?"\n{b}: "Not you."',
  ],
  'let-it-lie': [
    '{a} has a whole conversation ready for {b}, and decides at the last second not to have it.\n{b}: "Night, then."\n{a}: "Night."',
    '{b} waits for {a} to raise it. {a} doesn’t, and both of them notice.\n{b} (to camera): "{a} knows something. {a} didn’t say it."',
    '{a} lets it go.\n{a} (to camera): {cam:drop-it}',
    '{a} keeps quiet.\n{a} (to camera): "Not tonight. I’m too tired to fight."',
    '{a} turns the light off without a word.\n{b}: "You alright?"\n{a}: "Fine."',
  ],
  'promised-nothing': [
    '{b} offers {a} something reassuring, and {a} turns it down.\n{a}: "Don’t promise me anything. I’d rather know where I actually stand."\n{b}: "Okay."',
    '{b} tries to comfort {a}.\n{b}: "You’re safe with me."\n{a}: "Nobody’s safe with anybody in here."',
    '{a} won’t accept promises.\n{a}: "Words are cheap tonight."\n{b} (to camera): "{a} is scared. And sharp."',
    '{b} reassures, and {a} isn’t having it.\n{b}: "I’ve got you."\n{a}: "You had me yesterday, too."',
    '{a} declines the comfort politely.\n{a}: "Thanks. But show me at the table."',
  ],
  'awake-with-it': [
    '{a} lies there working out which of them it would have taken, and gets a different answer twice.\n{a} (to camera): "One more name and I’d be packing. You don’t sleep after that."',
    'Nobody wrote {a}’s name enough times tonight. {a} spends the dark on the word “enough”.\n{a} (to camera): {cam:frozen-out}',
    '{a} can’t sleep after the close call.\n{a} (to camera): {cam:cant-sleep}',
    '{a} goes over every name that was written.\n{a} (to camera): {cam:ballots}',
    '{a} plans how to fix it tomorrow.\n{a} (to camera): {cam:go-first}',
    '{a} lies awake, too wired to sleep.\n{a} (to camera): {cam:cant-sleep}',
    '{a} works out who {aSub} can still count on.\n{a} (to camera): "Short list. Shorter than this morning."',
    '{a} practises what to say at breakfast.\n{a} (to camera): {cam:rehearse}',
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
    '{a} and {b} talk about nothing at all for twenty minutes.\n{b}: "What’s the first thing you’ll eat when you get home?"\n{a}: "A proper curry."\n{b}: "Same."',
    '{a} and {b} argue about music at midnight.\n{a}: "That song is terrible."\n{b}: "It’s a classic."\n{a}: "It’s terrible."',
    '{a} and {b} chat about home.\n{b}: "What’s your mum like?"\n{a}: "Loud. You’d love her."',
    '{a} and {b} have a normal conversation, for once.\n{a} (to camera): {cam:switch-off}',
    '{a} and {b} talk about telly.\n{b}: "Have you seen that new baking thing?"\n{a}: "Obsessed."',
  ],
  funny: [
    '{b} does an impression of the host, cruel and extremely accurate, and {a} has to leave the room.\n{a}: "Stop it!"\n{b}: "Welcome, Traitors…"\n{a} is crying laughing.',
    '{a} and {b} get the giggles about something so small neither can explain it.\n{b}: "Why are we laughing?"\n{a}: "I don’t know!"',
    '{a} and {b} laugh until it hurts.\n{b} (to camera): "Needed that. Really needed that."',
    '{b} tells a story about the first night, and {a} can’t breathe.\n{a}: "You didn’t."\n{b}: "I did."',
    '{a} and {b} play a silly game in the dark.\n{a}: "Would you rather—"\n{b}: "Not again."',
  ],
  kind: [
    '{b} notices {a} isn’t all right, and stays without asking.\n{b}: "I’m not going anywhere."\n{a}: "Thank you."',
    '{a} doesn’t have to say anything, and {b} doesn’t make {aObj}.\n{b}: "Cup of tea?"\n{a}: "Please."',
    '{b} sits with {a} in silence.\n{a} (to camera): "{b} just knew. Didn’t ask. Just stayed."',
    '{b} gives {a} a hug at the door.\n{b}: "You’re doing great."\n{a}: "Am I?"\n{b}: "You are."',
    '{b} makes sure {a} is okay.\n{b}: "Tomorrow’s a new day."\n{a}: "Thank God."',
  ],
  hollow: [
    '{a} and {b} talk for twenty minutes, and neither says one true thing.\n{b}: "Lovely evening."\n{a}: "Lovely."\n{a} (to camera): "That was exhausting."',
    'The conversation is pleasant and completely empty.\n{a} (to camera): "We were both just performing."',
    '{a} and {b} make small talk.\n{b}: "Busy day."\n{a}: "Very."\nNeither means any of it.',
    '{a} and {b} chat politely.\n{b} (to camera): "I don’t trust {a}. {a} doesn’t trust me. We both smiled."',
    '{a} leaves the conversation feeling worse.\n{a} (to camera): "Fake. All of it."',
  ],
  alone: [
    '{a} reads the same page four times and falls asleep without noticing.\n{a} (to camera): "I don’t remember turning the light off. That’s how tired."',
    'There’s a point in the night where {a} stops playing and is just someone in a cold room.\n{a} (to camera): {cam:switch-off}',
    '{a} lies in bed thinking about home.\n{a} (to camera): {cam:homesick}',
    '{a} looks out of the window at the dark grounds.\n{a} (to camera): {cam:the-place}',
    '{a} thinks about why {aSub} came.\n{a} (to camera): {cam:why-here}',
    '{a} lets the game go for one night.\n{a} (to camera): {cam:switch-off}',
    '{a} is too tired to think.\n{a} (to camera): "My brain’s full. Nothing else is going in tonight."',
    '{a} lies awake, not thinking about the game for once.\n{a} (to camera): "I thought about my nan’s kitchen. That’s all. It was nice."',
    '{a} writes a letter home that {aSub} can’t send.\n{a} (to camera): {cam:homesick}',
    '{a} has a long bath and doesn’t think about anyone.\n{a} (to camera): {cam:switch-off}',
    '{a} listens to the castle creak.\n{a} (to camera): {cam:the-place}',
    '{a} does some stretches on the floor.\n{a} (to camera): "Got to look after yourself in here. Nobody else will."',
    '{a} thinks about the prize money.\n{a} (to camera): {cam:why-here}',
    '{a} falls asleep with the lamp on.\n{a} (to camera): {cam:switch-off}',
    '{a} makes a hot chocolate and drinks it alone.\n{a} (to camera): {cam:alone-choice}',
    '{a} lies thinking about the people {aSub} misses.\n{a} (to camera): {cam:homesick}',
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
