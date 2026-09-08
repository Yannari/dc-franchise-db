// ══════════════════════════════════════════════════════════════════════
// tr/castle/testing.js — asking for a commitment, then watching whether it
// holds
// ══════════════════════════════════════════════════════════════════════
//
// DISTINCT FROM trust.js ON PURPOSE. trust.js is about FORMING bonds — a
// confidence shared, a circle closing, an alliance warming. This family is
// about PROBING one that already exists: a deliberate, engineered test with
// a controlled variable, run BY one player ON another, to find out whether
// the other person is who they say they are. trust.js's own flagship
// ("will you vote with me tonight?") is the one place the two families
// already overlap in shape — a real ask with a real answer — and every
// event here is built the same way for the same reason: a probe is only a
// probe if the outcome is a genuine check against the TARGET's stats, never
// a coin the actor's own narration dresses up afterward.
//
// No belief writes. A test that comes back "failed" tells the tester
// something about the target's character, not their alignment — a loyal
// Faithful can fail a loyalty oath out of nerves, and a smooth Traitor can
// pass every single one of these. That gap between what a test measures and
// what the room WANTS it to measure is the whole reason this family reads
// as "frequently wrong" rather than as free evidence.
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import { lineFor } from './lines.js';
import { findOpenThread, priorMoments } from '../threads.js';

const FAMILY = 'testing';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Line pools chosen by hash, not by rng — see lines.js for why a `pick()`
// added to an event that did not already have one reroutes the season.
// ── REWRITE (Task 7 stage 6): THE FOUR COIN-FLIP TESTS ────────────────
//
// `testing-small-dare`, `testing-ask-for-alibi-check`, `testing-double-check-
// story` and `testing-silence-test` all shipped the same shape — one `rng() <
// stat` comparison and two branches — and the audit marked all four REWRITE
// for it ("2 branches, short of four materially different paths"). Two of them
// also wrote no thread at all before stage 2's migration.
//
// The shape is wrong in a specific way rather than merely thin: a test has a
// SUBJECT and a RESULT, and a coin flip collapses them. Whether the account
// stands up is one axis; whether the person being tested WORKS OUT THEY ARE
// BEING TESTED is a completely different one, and it is the axis this family's
// own flagship (`testing-decoy-secret`) is built on. Every one of the four now
// forks on both, and every fork reads something stored — the arc's own beat
// count (how many times this pair has been round this), the tested player's
// stats, and in the alibi check the third party's willingness to be drawn.
const DARE_LINES = {
  complied: [
    '{a} floated a small, pointless ask, and {b} just went along with it — no questions.',
    '{a} asked {b} for something trivial and slightly odd, and {b} did it without breaking stride.',
    '{b} swapped seats because {a} asked them to, and never asked why.',
    '{a} tested it with something that did not matter at all, and {b} passed without noticing there had been a test.',
    '{a} asked {b} to carry something across a room and {b} carried it.',
    'It took nine seconds and {b} did not think about it once, before or afterwards.',
    '{a} learned something for free, which does not happen often in here.',
    '{b} said “sure” before {a} had finished the sentence.',
  ],
  refused: [
    '{a} floated a small, pointless ask, and {b} pushed back on it, which told {a} something.',
    '{b} wanted to know why before doing a thing that took four seconds, and {a} filed that.',
    '{a} asked for nothing much and {b} said no to it, pleasantly, and completely.',
    '{b} laughed and did not move, and the not moving was the answer {a} came for.',
    '“Why,” said {b}, which is a perfectly reasonable question and was not the answer {a} wanted.',
    '{b} does not do things because somebody asked, and has apparently never done things because somebody asked.',
    'It was a nothing. {b} treated it as a something, and that is the finding.',
    '{a} got a no to a request that had no cost attached, which is worth more than a yes would have been.',
  ],
  'named-the-test': [
    '{b} did the thing and then said, quite mildly, “that was a test, wasn’t it.”',
    '{a} got compliance and a diagnosis in the same fifteen seconds.',
    '“You do this,” said {b}. “Little asks. I have noticed.” {a} had not expected to be the subject.',
    '{b} moved the chair, sat down in it, and asked {a} what {a} had been checking.',
    'It worked perfectly and {b} understood exactly what had worked, which cancels most of it.',
    '{b} has been tested before, by better people than {a}, and said as much.',
    '{a} came away with an answer and with the knowledge that the answer is now unreliable.',
    '“Ask me the real one,” said {b}, and went back to the washing up.',
  ],
  'over-delivered': [
    '{a} asked {b} for a small favour to see what would happen, and {b} did it and then kept going unprompted.',
    '{b} took a four-second favour and turned it into twenty minutes of being helpful.',
    'It was a test of whether {b} would. {b} did, and then did considerably more, unasked.',
    '{a} wanted a yes. {a} got an afternoon, and is not sure what to do with it.',
    '{b} is either the most decent person in this castle or is working very hard at something.',
    'The over-delivery was the interesting part and {a} does not yet know whether it was genuine.',
    '{b} finished the job {a} had invented and then found another one.',
    '{a} has an answer and it is not the binary answer {a} went in for.',
  ],
};

const ALIBI_CHECK_LINES = {
  ok: [
    '{a} quietly cross-checked {b}’s story with a third person. It matched, clean.',
    '{a} took {b}’s account to somebody else and came back with nothing to worry about.',
    'Two people put {b} in the same place at the same time, and {a} had asked them separately.',
    '{a} went looking for a hole in {b}’s evening and did not find one.',
    '{a} asked around about {b} without ever saying they were asking, and everything came back fine.',
    'Two separate accounts of {b}’s evening, both dull, both the same, and {a} believed both.',
    'The hour is accounted for by two people who have no reason to agree, and they agree.',
    '{a} spent the morning checking {b}’s account and found no contradiction.',
  ],
  bad: [
    '{a} took {b}’s account to a third person and came back with a different night.',
    'The hour {b} had in the kitchen, somebody else has in the corridor, and {a} has both.',
    '{a} asked two people where {b} had been that evening and received conflicting accounts.',
    'Somebody put {b} somewhere {b} had not mentioned being, and did it without being led.',
    '{a} asked others to confirm {b}’s account and found a major contradiction.',
    '{b}’s account did not match what two other people told {a}.',
    'Nobody is calling {b} a liar. Nobody can put {b} where {b} says {b} was either.',
    '{a} now has two conflicting accounts of where {b} spent the same hour.',
  ],
  'nobody-would-say': [
    '{a} asked three people about {b}’s evening and all three of them declined to have an opinion.',
    'Nobody {a} asked would confirm where {b} had spent the previous evening.',
    'Three people declined to confirm {b}’s account of the previous evening.',
    '{a} could not get a single soul to put {b} anywhere, good or bad.',
    'The three people {a} asked have each decided not to help with this, and {a} does not know why.',
    'Everyone {a} approached avoided the question of where {b} had been the previous evening.',
    '{a} found nobody willing to support or contradict {b}’s account of the previous evening.',
    'Two people changed the subject when {a} mentioned {b}; the third asked why {a} was checking.',
  ],
  'got-back-to-them': [
    '{a} checked {b}’s account with somebody, and that somebody told {b} before lunch.',
    '{b} knows {a} has been asking. {b} found out from a third party, which is the worst way.',
    '{a} confirmed {b}’s account, but the person they asked told {b} about the check that afternoon.',
    '{a} checked {b}’s account with the one person most likely to repeat the question.',
    '{b} learned that {a} had been checking their account and became more guarded around {a}.',
    '{a} forgot that questions about {b} would eventually make their way back to {b}.',
    '{a} learned that {b}’s evening is fine and that {b} now knows {a} doubted it.',
    'Learning about the check changed what {b} was willing to say in front of {a}.',
  ],
};
const OATH_LINES = {
  sincere: [
    '{a} asked {b} to commit to it in front of the room, and {b} did, without hesitating.',
    '{a} put the question publicly and {b} answered it publicly, straight away, and meant it.',
    '{b} said yes before {a} had finished asking, in front of everybody.',
    '{a} wanted it said out loud where witnesses were, and {b} said it out loud.',
    'There was no pause at all, which is the part everybody in that room noticed.',
    '{b} said it plainly, twice, and offered to say it again if anybody had missed it.',
    '{a} had expected to have to ask twice and did not have to ask twice.',
    '{b} used {a}’s name in the promise, which nobody does unless they mean it.',
    'It cost {b} something to say it in front of that many people, and {b} said it anyway.',
    'The room got a commitment it had not been expecting and did not know what to do with it.',
  ],
  reluctant: [
    '{b} said what {a} wanted to hear, but it took visible effort to get there.',
    '{b} got to the right answer the long way round, and the room watched the whole route.',
    '{a} got the commitment. {a} also got a pause before it that everybody heard.',
    '{b} agreed, eventually, in a voice that was doing something other than agreeing.',
    '{b} said yes and then immediately explained what yes did not include.',
    'It arrived. It arrived late and slightly bent, and everybody heard the shape of it.',
    '{b} looked at the floor for the whole of the promise, which is not where you look.',
    '{a} got the words and did not get whatever it is that usually comes with them.',
    '{b} agreed in the third person, somehow, which nobody could quite object to.',
    'Two people in the room said afterwards that they would not have counted it.',
  ],
  refuses: [
    '{b} flatly refused to make the commitment {a} was asking for, publicly.',
    '{b} said they were not going to promise anybody anything, and said it to the room, not to {a}.',
    '{a} asked for a promise and got a lecture about promises.',
    '{b} would not say the words, and did not pretend to be sorry about it.',
    '“I do not do promises in rooms,” said {b}, and left the room.',
    '{b} pointed out that anybody who says it out loud is planning to break it quietly.',
    '{a} asked in front of six people and got a no in front of six people.',
    '{b} offered {a} something smaller instead and {a} did not want the smaller thing.',
    'The refusal was polite, complete, and considerably more informative than a yes.',
    '{b} has been made to promise things before and it did not end well, and said so.',
  ],
  'asked-for-one-back': [
    '{b} swore it, and then asked {a} to swear the same thing, which had not been the arrangement.',
    '{a} wanted an oath. {b} gave one and required one, and {a} had about two seconds to decide.',
    '{b} said yes and then turned it round: the same words, from {a}, out loud, now.',
    '{b} agreed, but only if {a} swore the same thing back, which turned the whole conversation around.',
    '{b} agreed on one condition, and the condition was that {a} was in it as deep.',
    '{a} came away with an oath and a matching obligation and is not sure {a} came out ahead.',
    '{b} has been asked to prove things all week and decided tonight that it should go both ways.',
    'Two people swore something in that corridor and only one of them had planned to.',
  ],
};

const REVERSE_PSYCH_LINES = {
  calm: [
    '{a} pretended to distrust {b} just to see the reaction. {b} just laughed it off.',
    '{a} accused {b} of something they did not believe, and {b} agreed with them cheerfully.',
    '{a} baited {b}, badly on purpose, and {b} took it exactly as seriously as it deserved.',
    '{b} saw it coming, said so, and made {a} say what they were actually after.',
    '{b} let {a} run the whole thing and then asked, pleasantly, what the point had been.',
    'It did not land at all. {b} was simply not the sort of person it lands on.',
    '{b} answered the real question instead of the one {a} had constructed.',
    '{a} pushed and {b} did not move, and there was nothing behind the push.',
    '{b} has been managed by better people than {a} and said so, without any edge on it.',
  ],
  rattled: [
    '{a} pretended to distrust {b} just to see the reaction, and {b} got visibly rattled.',
    '{a} said something they did not mean and {b} spent ten minutes answering it.',
    'It was not a real accusation. {b} defended themselves from it like it was.',
    '{b}\'s face did the whole thing before {b}\'s mouth caught up, and {a} watched both.',
    '{b} got loud about something that did not merit loud, which is the finding.',
    'It took one sentence to take {b} apart and {a} had prepared three.',
    '{b} defended a position {b} had not previously held, at some volume.',
    '{a} said the opposite of what {a} thought and {b} argued with all of it.',
    '{b} was still going four minutes after {a} had stopped needing an answer.',
  ],
  // -- TASK 7 STAGE 4: TWO BRANCHES SHORT OF FOUR, AND NOW FOUR ----------
  //
  // The audit's verdict was REWRITE: two branches, both of them the TESTER
  // getting a result. The two added are the two ways the test can go wrong for
  // the person running it, which is what a bait is actually risky about --
  // being seen doing it, and having it turned round on you.
  'saw-through-it': [
    '\u201cYou don\u2019t believe that,\u201d {b} said, about four seconds in. \u201cSo what are you actually asking me?\u201d',
    '{b} named the manoeuvre out loud while {a} was still halfway through performing it.',
    '{a} baited {b} and {b} said, pleasantly, that {a} could just ask the question instead.',
    '{b} let {a} finish and then asked what {a} had been hoping to see, which {a} could not answer.',
    '{b} was not annoyed about it, which was somehow worse for {a} than being caught out.',
  ],
  'turned-it-round': [
    '{b} took the bait, ran with it, and by the end of it {a} was the one explaining themselves.',
    '{a} said something {a} did not mean and {b} agreed enthusiastically and asked what {a} planned to do about it.',
    '{b} answered the fake accusation with a real one, and {a} had walked into it.',
    '{b} took control of the conversation about halfway through, and {a} did not get it back.',
    '{b} finished the conversation holding everything {a} had come in with, and {a} knew it.',
  ],
};

const HYPOTHETICAL_LINES = {
  reassured: [
    '{a} asked {b} what they would do if {a} got banished next. {b}’s answer landed as sincere.',
    '"If it’s me tomorrow," said {a}, and {b} answered the whole question, properly.',
    '{a} put the worst version of tomorrow to {b}, and {b} did not flinch from it.',
    '{b} told {a} exactly who they would go after, and it was believable.',
    '{a} asked the frightening question and {b} answered it like it was an ordinary one.',
    '{b} did not need the hypothetical explained twice, and gave {a} a name inside a minute.',
  ],
  hedged: [
    '{a} asked {b} what they would do if {a} got banished next. {b} hedged, and {a} noticed the hedge.',
    '{a} asked a direct question about tomorrow and got a paragraph about today.',
    '{b} said it would not come to that, twice, and did not say what they would do if it did.',
    '{b} answered around the edges of it, and {a} let them, and remembered.',
    '{a} got a very warm answer with no information anywhere in it.',
    '{b} agreed with the premise, agreed with the stakes, and would not finish the sentence.',
  ],
  'asked-it-back': [
    '{a} asked {b} what {b} would do. {b} asked {a} the same thing, first, and waited.',
    '"You go," {b} said. "You tell me what you’d do, and then I’ll tell you." {a} had not planned for that.',
    '{b} recognised the shape of the question and handed it straight back across the table.',
    '{a} ended the conversation having answered more of it than {b} had.',
    '{b} would not be measured without measuring {a} at the same time, and said so pleasantly.',
    '{b} started testing {a} right back about halfway through, and by the end neither of them was sure who learned more.',
  ],
  'made-a-condition': [
    '{b} said yes, and then said what it would take, and {a} had not expected a price.',
    '{b} agreed to the deal, but only if {a} answered a question of {b}’s first. {a} had not expected that.',
    '{b} answered {a}’s hypothetical with a real one, and there were terms in it.',
    '{a} got a commitment out of {b} with a condition bolted onto the end of it.',
    '{b} would do it. {b} named exactly what {a} would owe for it, out loud, without embarrassment.',
    'It was not a no. It was a yes with a number attached, and {a} spent the evening on the number.',
  ],
};

// See the note over `DARE_LINES` for why these four events were all rewritten
// together: they shipped one `rng() < stat` comparison each, and a test has a
// subject and a result rather than a single coin.
const DOUBLE_CHECK_LINES = {
  consistent: [
    '{a} asked {b} to walk through their morning again. It matched, word for word.',
    '{a} made {b} tell it a second time and it came out the same, including the boring parts.',
    'Second telling, same order, same details. {a} had been hoping for otherwise.',
    '{b} retold it with a shrug and got every hour of it right.',
    '{a} asked for it again out of order and {b} reassembled it without a wobble.',
    '{b} told it the second time slightly more briefly and did not lose a single thing out of it.',
    '{a} was hoping for a seam. {b} does not appear to have any.',
    'Same hours, same order, same shrug at the end. {a} put the question away.',
    '{b} answered a question {b} had already answered without once pointing out that {b} had.',
    'It came out identically, which either means it is true or means {b} is very good.',
    '{a} listened for the rehearsed bit and could not hear one.',
  ],
  inconsistent: [
    '{a} asked {b} to walk through their morning again, and it came out different the second time.',
    'The second version had a room in it the first version did not, and {a} caught it.',
    '{b} moved half an hour around between the two tellings and did not notice doing it.',
    '{a} asked again and got a tidier story, which is worse than a messier one.',
    'The second version was missing the one detail {a} had actually been listening for.',
    '{b} added something the second time that had not been there, and did not notice adding it.',
    'The first telling had a person in it. The second one did not, and {a} had been waiting for that person.',
    '{b} got the order wrong and corrected it, twice, and the correction was the interesting part.',
    'It was a better story the second time, which is not what happens to true ones.',
    '{a} asked for it out of order and {b} could not reassemble it, and both of them heard that.',
    '{b} said that {a} had already asked, which is true and is also not an answer.',
  ],
  'would-not-repeat-it': [
    '“I have told you,” said {b}, and did not tell {a} again.',
    '{b} declined to walk through it a second time and gave no reason for declining.',
    '{a} asked for the morning again and got a flat, pleasant no.',
    '{b} pointed out that people who are asked twice are people who are suspected once.',
    '“You either believe me or you do not,” said {b}, which is true and is not an account.',
    '{b} would answer anything except the thing {b} had already answered.',
    '{a} has no second version to compare, because {b} would not provide one.',
    'The refusal is the finding, and {a} is not sure what it is a finding of.',
  ],
  'asked-why-twice': [
    '“That is twice,” said {b}. “Why is it twice?” — and {a} did not have a good answer ready.',
    '{b} answered the whole thing again and then asked {a} what had changed since yesterday.',
    '{a} got the account and got the question back, and the question was the harder of the two.',
    '{b} noticed the check, named it, and answered anyway, which is the worst combination for {a}.',
    '“Ask me what you actually want to know,” said {b}, having just told {a} the whole morning.',
    '{b} has been counting how many times {a} has asked, and produced the number.',
    'The story held. The relationship it was told inside did not.',
    '{a} came away with a clean account and a person who now watches {a} back.',
  ],
};

const SILENCE_LINES = {
  chased: [
    '{a} went quiet on purpose to see if {b} would chase it. {b} did, almost immediately.',
    '{a} stopped talking mid-thought, and {b} could not leave it there.',
    '{a} let the silence run, and {b} filled it, twice.',
    '{b} came and found {a} an hour later to finish the sentence {a} had abandoned.',
    '{b} lasted about four seconds, which is a shorter time than {b} would have guessed.',
    '“Go on,” said {b}, and then said it again, and then asked outright.',
    '{a} said nothing at all and {b} did all of the work of the conversation.',
    '{b} broke the silence by asking {a} what they were trying to prove.',
  ],
  letgo: [
    '{a} went quiet on purpose to see if {b} would chase it. {b} let it be quiet right back.',
    '{a} left a gap. {b} sat in it comfortably and said nothing at all.',
    '{a} was waiting to be asked. {b} did not ask, and it was a long morning.',
    '{b} matched the silence exactly, which told {a} either a great deal or nothing.',
    'They sat there for a full minute and {b} was the more comfortable of the two.',
    '{b} finished the tea, said goodnight, and never once asked what {a} had been about to say.',
    '{a} ran out of silence before {b} did.',
    'Nobody in this castle is that incurious by accident, and {a} thought so all afternoon.',
  ],
  'filled-it-with-their-own': [
    '{a} left a gap and {b} filled it with something {a} had not asked about at all.',
    'The silence got used, and it got used by {b}, for {b}’s own purposes.',
    '{a} was fishing. {b} put something completely different in the net and walked off.',
    '{b} took the quiet as an invitation and confessed to an unrelated thing.',
    '{a} wanted to know about last night and heard about a deal made on Tuesday instead.',
    'It worked, in that {b} talked. It failed, in that none of it was about the subject.',
    '{b} needed somewhere to put something and {a} had accidentally provided one.',
    '{a} got more than {a} came for and none of what {a} came for.',
  ],
  'out-waited-them': [
    '{b} let the silence run, and then let it run longer, and {a} was the one who broke.',
    '{a} set the trap and stepped in it, which {b} watched happen without comment.',
    'Two people waited each other out and {a} lost by about ninety seconds.',
    '{b} has done this before and is better at it, and {a} found that out the slow way.',
    '{a} broke the silence first, undermining the test {a} had set for {b}.',
    'The test ran in reverse for most of a morning, and {b} never acknowledged that it had.',
    '{b} said nothing for so long that {a} volunteered something to end it.',
    'It is very hard to run a silence on somebody who likes silence.',
  ],
};
const COLD_READ_LINES = {
  'read-it-right': [
    '{a} dropped a leading line about {c} into the conversation purely to watch what crossed {b}’s face, and something did.',
    '{a} said something almost true about {c}, watched {b} instead of listening, and got exactly what {a} came for.',
    '{a} put {c}’s name down in front of {b} like a card, face up, and {b} looked at it a beat too long.',
    '{a} pretended to have heard something about {c}. {b}’s reaction was the information, and it was good information.',
    '{a} guessed at what {b} thought of {c} and said it as a statement, and {b} agreed before thinking about why {a} knew.',
    '{a} mentioned {c} in the wrong context on purpose and read {b} instead of listening to them, and read {b} correctly.',
  ],
  'read-it-wrong': [
    '{a} dropped {c}’s name in front of {b} to see what happened, and what happened was nothing at all.',
    '{a} was certain {b} had a problem with {c}. {b} does not have a problem with {c}, and did not say so.',
    '{a} read the pause as meaning something. The pause meant {b} was thinking about the washing up.',
    '{a} came away from that conversation with a read on {b} and {c} that was confidently the wrong way round.',
    '{a} watched {b} very carefully and drew a conclusion, and nobody in this castle is ever going to correct it.',
    '{b} gave {a} a completely ordinary reaction and {a} decided it was not one.',
  ],
  'said-it-aloud': [
    '{a} brought up {c} to see how {b} reacted, and then admitted that was why {a} had brought {c} up.',
    '"I was watching you, just then," {a} admitted, which surprised {b} more than the test itself had.',
    '{a} got the information and immediately handed it back, because {a} could not do the other thing to {b}.',
    '{a} explained the trick to {b} halfway through performing it, and both of them found that funny.',
    '{a} said {c}’s name to read {b} and then told {b} that was why, and {b} respected it.',
    '{a} told {b} what the conversation had really been about, deliberately, and {b} took that as a sign of trust.',
  ],
  'kept-it': [
    '{a} read {b} on {c}, got a clear answer, and gave {b} absolutely nothing back.',
    '{b} answered a question {b} had not realised was a question, and {a} moved the conversation on.',
    '{a} put {c}’s name in front of {b}, took what came off {b}’s face, and thanked {b} for nothing.',
    '{b} came out of that conversation feeling vaguely used and unable to point at the moment.',
    '{a} took the read upstairs, unshared, and {b} noticed the not-sharing without noticing the read.',
    '{a} paid nothing for what {a} got, and {b} worked out later that {a} had not.',
  ],
};

// -- TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ------------
//
// One branch (`followed-through`) became four. The premise is that somebody is
// still quietly being marked, and the only outcome written was that they were
// still passing -- so the event could never report the thing it exists to look
// for. It can now: the promise is half-kept, it is dropped, or the person
// being marked works out that they are being marked, which is the worst of the
// four for the person doing the marking.
const FOLLOW_THROUGH_LINES = {
  'followed-through': [
    '{a} kept quietly checking whether {b} was still holding up to whatever they\'d been asked before.',
    '{a} never said the word out loud again, and went on checking every day that {b} was keeping it.',
    '{b} did not know they were still being marked. {a} was still marking.',
    '{a} looked for the day {b} would let it slip, and it had not been today either.',
    'It had been asked once and never repeated, and {a} was watching the answer hold.',
  ],
  'half-kept-it': [
    '{b} did most of it. {a} noticed which part {b} had quietly left undone.',
    'It was nearly kept, whatever it was, and nearly is a word {a} had not been expecting to need.',
    '{b} honoured the letter of it and not much else, and {a} had been watching for exactly that.',
    '{a} could not call it broken and could not call it kept, and spent the evening on the difference.',
    '{b} would have passed anybody else\u2019s check. {a} is not anybody else.',
  ],
  'dropped-it': [
    '{b} had not kept it. {a} watched {b} not keep it and said nothing at all.',
    'Whatever {b} had agreed to, {b} had stopped doing it about a day ago, and {a} had the day.',
    '{a} had been waiting for the moment {b} let it go, and it arrived without any drama at all.',
    '{b} let it slip in a sentence about something else entirely, which is always how it happens.',
    'It was small and it was clear: {b} is not doing the thing {b} said {b} would do.',
  ],
  'clocked-the-check': [
    '\u201cYou keep asking me that,\u201d {b} said to {a}. \u201cIn slightly different words. Every day.\u201d',
    '{b} worked out that {a} had been marking, and let {a} know that {b} had worked it out.',
    '{a} asked the sideways question one time too many and {b} named it out loud.',
    '{b} answered the real question instead of the one {a} had asked, which ended the arrangement.',
    '\u201cWhatever you\u2019re checking,\u201d {b} said, \u201cI\u2019d rather you just checked it.\u201d {a} had no answer ready.',
  ],
};


registerEvent({
  id: 'testing-small-dare',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `testing|morning`.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'intuition'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-small-dare');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // HOW MANY TIMES THIS PAIR HAS ALREADY BEEN ROUND IT, off the stored arc.
    // The second small ask is a small ask; the fourth is a pattern, and a
    // person with any intuition at all eventually names it.
    const existing = findOpenThread(FAMILY, [a, b]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const scores = {
      complied: (st.loyalty / 10) * 0.5 + 0.1,
      refused: (1 - st.loyalty / 10) * 0.45 + 0.05,
      'named-the-test': (st.intuition / 10) * 0.3 + Math.min(3, times) * 0.1,
      'over-delivered': (st.social / 10) * 0.3 + (st.loyalty / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'complied';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-the-test' ? 'did the thing and said what it had been'
      : branch === 'over-delivered' ? 'was asked for a small thing and gave an afternoon'
        : 'set a small test to see if it would be taken';
    const bondDelta = branch === 'complied' ? 0.5
      : branch === 'refused' ? -0.5
        : branch === 'named-the-test' ? -1 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DARE_LINES[branch], `testing-small-dare|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // TERMINAL: a test that gets named out loud is a test that has stopped
    // working, and `turned-back` is what it came home as — the same outcome
    // `testing-cold-read-check:clocked-the-check` closes on.
    if (thread && branch === 'named-the-test') {
      api.resolveArc(thread.id, 'turned-back', { source: sceneWhy });
    }
    const out = { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // AND ON ONE BRANCH THE DIRECTION REVERSES, which `roles: 'initiator-first'`
    // cannot express: when {b} names the test, {b} is speaking and {a} is the
    // one answering for it. An explicit pair on the result takes precedence
    // over `roles` — see `sceneSpeakers` in js/tr/events.js.
    if (branch === 'named-the-test') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  id: 'testing-ask-for-alibi-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  // ACT: TESTING. Asking somebody to vouch for a night presumes there are
  // nights worth asking about and enough people left that an alibi can be
  // checked against somebody else's.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|dawn` held no advancer at
  // all, so a test opened at dawn could never be followed up at dawn. A
  // cross-check is definitionally a repeat: the second one is only worth
  // narrating against the first, which is what the citation supplies.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'loyalty'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-ask-for-alibi-check');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // THE THIRD PARTY IS A REAL PERSON WITH A REAL DISPOSITION, read off the
    // living roster and their own stats rather than treated as an oracle. A
    // check is only as good as the person you check with, and two of the four
    // branches below are about that person rather than about {b}.
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const sc = c ? pStats(c) : null;
    const scores = {
      ok: (st.temperament / 10) * 0.45 + 0.1,
      bad: (1 - st.temperament / 10) * 0.4 + 0.05,
      // A castle that will not be drawn is a castle full of careful people.
      'nobody-would-say': sc ? (sc.temperament / 10) * 0.25 + (1 - sc.social / 10) * 0.15 : 0,
      // And a sociable third party is a third party who repeats things.
      'got-back-to-them': sc ? (sc.social / 10) * 0.3 + (1 - sc.loyalty / 10) * 0.15 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'ok';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'nobody-would-say' ? 'could not get anybody to be drawn on it'
      : branch === 'got-back-to-them' ? 'checked an account with somebody who repeated the checking'
        : 'took somebody\'s account of the night to a third party';
    const bondDelta = branch === 'ok' ? 0.5
      : branch === 'bad' ? -1
        : branch === 'nobody-would-say' ? 0 : -1.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'got-back-to-them' && c) api.addBond(a, c, -0.5, { source: sceneWhy });
    const line = lineFor(ALIBI_CHECK_LINES[branch],
      `testing-ask-for-alibi-check|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // ONE PARTICIPANT ON THE RECORD, BECAUSE ONE PERSON IS IN THIS SCENE.
    // Every branch of an alibi check is conducted BEHIND {b}'s back — {a} takes
    // {b}'s account to third parties ({b} is not in the room), and even
    // `got-back-to-them` has {b} finding out afterwards rather than being
    // present. Reporting `pair: [a, b]` put {b} into `sceneParticipants`, so the
    // screen composed a two-hander and handed {b} an establishing card ("{a} and
    // {b} are at the bottom of the stairs"), a face-to-face reaction ("{b}
    // stumbles, laughs...") and a consequence that then said "{b} has no idea a
    // question was asked" — three cards of a conversation {b} was never in. Same
    // defect and same fix as `susp-pattern-tracking`, `trust-defend-in-absentia`
    // and `cover-feign-fear:borrowed-it`: report `actor` alone, so `_mode`
    // composes the solo/single scene the event actually is. The convened pair
    // [a, b] is still keyed for cooldowns at pick time (js/tr/events.js), and
    // `api.addBond(a, b, …)` above is untouched, so the simulation is unchanged.
    return { branch: branch === 'ok' ? 'checks-out' : branch === 'bad' ? 'inconsistent' : branch,
      actor: a, topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-loyalty-oath',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'loyalty', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-loyalty-oath');
    const sceneWhy = 'asked for it out loud';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const sincereScore = (st.loyalty / 10) * 0.5 + (st.boldness / 10) * 0.3 + 0.1;
    const reluctantScore = 0.35;
    const refusesScore = (1 - st.loyalty / 10) * 0.5 + (1 - st.boldness / 10) * 0.15;
    // A FOURTH ANSWER TO BEING ASKED, and it is the only one that changes who
    // is being tested: {b} swears and requires the same of {a}. Strategic and
    // boldness in the person UNDER the test, a pairing none of the three
    // above reads.
    const mutualScore = (st.strategic / 10) * 0.35 + (st.boldness / 10) * 0.2;
    const total = sincereScore + reluctantScore + refusesScore + mutualScore;
    const roll = rng() * total;
    let branch;
    if (roll < sincereScore) branch = 'sincere';
    else if (roll < sincereScore + reluctantScore) branch = 'reluctant';
    else if (roll < sincereScore + reluctantScore + refusesScore) branch = 'refuses';
    else branch = 'asked-for-one-back';

    const line = lineFor(OATH_LINES[branch], `testing-loyalty-oath|${ctx.ep}|${branch}`, { a, b });
    // A mutual oath binds harder than a given one: both of them are in it.
    const bondDelta = branch === 'sincere' ? 2 : branch === 'asked-for-one-back' ? 2.5
      : branch === 'reluctant' ? 0 : -2;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // THE EVENT DOES NOT KNOW WHO IT IS WATCHING and must not pretend to. An
    // oath sworn sincerely reads as `kind` whoever swears it — and a Traitor
    // swearing one has their affection damped to a quarter by crowd.js anyway,
    // which is the whole point of putting that rule in ONE place. Declaring
    // `masterful` here instead paid six Faithfuls a villain's ledger over 100
    // seasons, because `a` is whoever the scene drew and not a Traitor.
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: t?.id, bondDelta,
      crowd: branch === 'sincere' ? { name: a, colour: 'kind', mult: 0.6 }
        : branch === 'refuses' ? { name: a, colour: 'cowardly', mult: 0.4 } : null };
  },
});

registerEvent({
  id: 'testing-reverse-psychology',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  // ACT: TESTING. Baiting somebody to watch their face is a mid-season move:
  // early there is nothing to bait them about, late the room is too small for
  // a test this indirect to stay private.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'intuition', 'boldness', 'strategic'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-reverse-psychology');
    const sceneWhy = 'argued the opposite to see what came back';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // FOUR OUTCOMES, TWO OF WHICH GO BADLY FOR THE TESTER. Sharpness is what
    // gets a bait caught and nerve is what gets it turned round, so the person
    // being tested decides all four -- which is what a test is for.
    const scores = {
      'stayed-calm': (st.temperament / 10) * 0.5 + 0.15,
      'got-rattled': (1 - st.temperament / 10) * 0.55 + 0.15,
      'saw-through-it': (st.intuition / 10) * 0.5 + (st.mental / 10) * 0.25,
      'turned-it-round': (st.boldness / 10) * 0.4 + (st.strategic / 10) * 0.35,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'stayed-calm';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const pool = branch === 'stayed-calm' ? REVERSE_PSYCH_LINES.calm
      : branch === 'got-rattled' ? REVERSE_PSYCH_LINES.rattled : REVERSE_PSYCH_LINES[branch];
    const bondDelta = branch === 'stayed-calm' ? 0.5
      : branch === 'got-rattled' ? -1 : branch === 'saw-through-it' ? -1.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(pool, `testing-reverse-psychology|${branch}|${ctx.ep}`, { a, b });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // THE DIRECTION IS THE BRANCH'S ON TWO OF THESE. On `saw-through-it` and
    // `turned-it-round` the person being tested takes the conversation over,
    // and the `roles: 'initiator-first'` declaration above would hand the
    // reaction card to the wrong one. `speaker`/`respondent` on the result
    // takes precedence -- see `sceneSpeakers` in js/tr/events.js.
    const bTakesIt = branch === 'saw-through-it' || branch === 'turned-it-round';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: t?.id, bondDelta };
  },
});

registerEvent({
  // ── REWRITE (Task 7 stage 5) ────────────────────────────────────────
  //
  // Two branches, `reassured` and `hedged`, chosen by one coin against
  // loyalty — the audit’s "2 branches, short of four materially different
  // paths" — and between them 17 of 287 loud seasons once `evening` opened up.
  //
  // FOUR ANSWERS TO A HYPOTHETICAL, and the two new ones are the two a real
  // person actually gives: they ask it back, or they answer it with a price
  // on it. Both are refusals of the frame, and neither is the same scene as
  // agreeing or waffling.
  id: 'testing-hypothetical-loyalty-question',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-hypothetical-loyalty-question');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const scores = {
      reassured: (st.loyalty / 10) * 0.6 + 0.1,
      hedged: (1 - st.loyalty / 10) * 0.4 + (1 - st.boldness / 10) * 0.25,
      'asked-it-back': (st.boldness / 10) * 0.4 + (st.intuition / 10) * 0.3,
      'made-a-condition': (st.strategic / 10) * 0.45 + (st.mental / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'asked-it-back' ? 'answered a hypothetical with the same hypothetical'
      : branch === 'made-a-condition' ? 'answered a hypothetical with a price on it'
        : 'asked a hypothetical and watched the answer';
    const bondDelta = branch === 'reassured' ? 1
      : branch === 'hedged' ? -0.5 : branch === 'asked-it-back' ? 0 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(HYPOTHETICAL_LINES[branch],
      `testing-hypothetical-loyalty-question|${branch}|${ctx.ep}`, { a, b });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // ON `asked-it-back` THE ANSWERER TAKES THE SCENE OVER, and the
    // `roles: 'initiator-first'` declaration above would hand the reaction
    // card to the wrong one. `speaker`/`respondent` on the result takes
    // precedence — see `sceneSpeakers`, js/tr/events.js, and the identical
    // note on `testing-reverse-psychology` above.
    const bTakesIt = branch === 'asked-it-back';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: t?.id, bondDelta };
  },
});
registerEvent({
  id: 'testing-double-check-story',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  // ACT: TESTING. Going back over a story you were already told is the
  // middle-act instinct: doubt with the patience to be quiet about it.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|morning` held no advancer
  // either. "Walk me through your morning AGAIN" is the single most literal
  // citation in the pool — the whole event is somebody re-asking a question
  // they already asked, and the day they first asked it is the point.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'intuition', 'boldness'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-double-check-story');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // HOW MANY TIMES {a} HAS ALREADY DONE THIS TO {b}, off the stored arc.
    // "Walk me through it again" is a question that changes meaning entirely
    // on the third asking, and both new branches are about that.
    const existing = findOpenThread(FAMILY, [a, b]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const scores = {
      consistent: (st.temperament / 10) * 0.5 + 0.15,
      inconsistent: (1 - st.temperament / 10) * 0.45 + 0.05,
      'would-not-repeat-it': (st.boldness / 10) * 0.2 + Math.min(3, times) * 0.1,
      'asked-why-twice': (st.intuition / 10) * 0.25 + Math.min(3, times) * 0.12,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'consistent';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'would-not-repeat-it' ? 'would not walk through it a second time'
      : branch === 'asked-why-twice' ? 'answered it again and asked why it was being asked again'
        : 'checked one account against another';
    const bondDelta = branch === 'consistent' ? 0
      : branch === 'inconsistent' ? -1
        : branch === 'would-not-repeat-it' ? -1.5 : -0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DOUBLE_CHECK_LINES[branch],
      `testing-double-check-story|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // TERMINAL: a check the subject names out loud has stopped being a check.
    if (thread && branch === 'asked-why-twice') {
      api.resolveArc(thread.id, 'turned-back', { source: sceneWhy });
    }
    const out = { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // The direction reverses when {b} turns the question round — see the same
    // note on `testing-small-dare` above.
    if (branch === 'asked-why-twice') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  id: 'testing-silence-test',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  // The second advancer in `testing|dawn` — see the note on the pair cooldown
  // above susp-whisper-about-absent.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'loyalty', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-silence-test');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const sa = pStats(a);
    const scores = {
      chased: (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.35,
      letgo: (1 - st.social / 10) * 0.4 + 0.05,
      // Somebody with something to put down will use a silence for their own
      // purposes, which is a result and not a failure.
      'filled-it-with-their-own': (st.social / 10) * 0.25 + (1 - st.temperament / 10) * 0.2,
      // And a person more comfortable with quiet than the person running the
      // test wins the test. That is {a}'s temperament against {b}'s.
      'out-waited-them': Math.max(0, (st.temperament - sa.temperament) / 10) * 0.5,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'chased';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'filled-it-with-their-own' ? 'used somebody else\'s silence for their own purposes'
      : branch === 'out-waited-them' ? 'out-waited the person running the silence'
        : 'left a silence to see who filled it';
    const bondDelta = branch === 'chased' ? 1
      : branch === 'letgo' ? -1
        : branch === 'filled-it-with-their-own' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(SILENCE_LINES[branch], `testing-silence-test|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    const out = { branch: branch === 'letgo' ? 'let-it-go' : branch,
      pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // The direction reverses when the test runs backwards — see the same note
    // on `testing-small-dare` above.
    if (branch === 'out-waited-them') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  // ── REWRITE (Task 7 stage 5) ──────────────────────────────────
  //
  // The audit’s verdict was REWRITE, and there were two things wrong rather
  // than one. The fork was in the wording — one branch, `cold-read`, over one
  // pool — and the effect was `api.addBond(a, b, 0)`, a delta of exactly
  // zero, which the scene API refuses with a `blockedBy: 'no-op'` receipt. So
  // this event fired, printed a sentence, and changed nothing about the
  // season at all.
  //
  // FOUR OUTCOMES, AND A COLD READ IS THE ONE MOVE IN THE POOL THAT CAN BE
  // WRONG WITHOUT ANYBODY FINDING OUT. That asymmetry is the event:
  //
  //   read-it-right  — {a} says the thing about {c} that {b} had not said,
  //                    and {b} confirms it. {a} has a real read now.
  //   read-it-wrong  — {a} does the same and is simply wrong, and {b} does not
  //                    correct it, which is worse for {a} than being corrected.
  //   said-it-aloud  — {a} tells {b} what {a} has just done, which turns a
  //                    private read into a shared one and costs {a} the edge.
  //   kept-it        — {a} gets the read and gives {b} nothing, and {b} feels
  //                    the giving-nothing.
  //
  // NOTHING HERE READS ALIGNMENT. `suspicion(a, c)` is what {a} already
  // thinks, which is the same pure read `trust-trade-reads` makes, and
  // `read-it-right` is scored on {a}’s intuition rather than on whether {c}
  // is in fact a Traitor. Being right about somebody’s MOOD is not being
  // right about their role, and this event claims only the first.
  id: 'testing-cold-read-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'social', 'strategic'],
    knowledge: ['incomplete', 'misinformed', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 7 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-cold-read-check');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    const sa = pStats(a);
    const scores = {
      'read-it-right': (sa.intuition / 10) * 0.6 + (sa.social / 10) * 0.2,
      'read-it-wrong': (1 - sa.intuition / 10) * 0.5 + 0.2,
      'said-it-aloud': (sa.social / 10) * 0.4 + Math.max(0, getBond(a, b)) / 10 * 0.3,
      'kept-it': (sa.strategic / 10) * 0.45 + (1 - sa.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'read-it-wrong' ? 'read them cold and got it wrong'
      : branch === 'said-it-aloud' ? 'said the read out loud instead of keeping it'
        : branch === 'kept-it' ? 'took a read and gave nothing back for it'
          : 'read them cold and said nothing about it';
    // EVERY BRANCH MOVES SOMETHING NOW. The old version’s zero delta was
    // refused by the scene API outright, so the event had no consequence at
    // all; these are small on purpose, because a cold read is a small move.
    const bondDelta = branch === 'read-it-right' ? 0.5
      : branch === 'read-it-wrong' ? -0.5 : branch === 'said-it-aloud' ? 1 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy,
      seed: lineFor(COLD_READ_LINES[branch], `testing-cold-read-check|${branch}|${ctx.ep}`,
        { a, b, c: target }) });
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: a, respondent: b, target,
      threadId: t?.id, bondDelta };
  },
});
registerEvent({
  id: 'testing-follow-through-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // CITES (Plan 5 Task 2). "Whatever they'd been asked before" is a sentence
  // with a hole in it where the day should be.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'intuition', 'temperament', 'social'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-follow-through-check');
    const sceneWhy = 'checked whether a promise was kept';
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    const sb = pStats(b);
    const scores = {
      'followed-through': (sb.loyalty / 10) * 0.5 + (sb.temperament / 10) * 0.25,
      'half-kept-it': (1 - sb.loyalty / 10) * 0.35 + (sb.strategic / 10) * 0.25,
      'dropped-it': (1 - sb.loyalty / 10) * 0.5 + 0.1,
      'clocked-the-check': (sb.intuition / 10) * 0.45 + (sb.social / 10) * 0.2,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'followed-through';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'followed-through' ? 0.5
      : branch === 'half-kept-it' ? -0.5 : branch === 'dropped-it' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep,
      lineFor(FOLLOW_THROUGH_LINES[branch], `testing-follow-through-check|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    // On `clocked-the-check` the marked player ends the arrangement, so the
    // scene changes hands and the field says so rather than the sentence.
    const bTakesIt = branch === 'clocked-the-check';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ── FLAGSHIP: the decoy secret — a four-way fork on the TARGET's own
// loyalty, temperament, social, and intuition ────────────────────────────
//
// The actor plants a piece of fabricated "secret" information with a single
// target and does nothing else — the test is entirely about what the
// target does with it next:
//   KEPT-QUIET          — high loyalty + temperament. It never resurfaces
//                         anywhere. Real trust confirmed; bond gain, and
//                         the thread closes clean.
//   REPEATED-INNOCENTLY  — high social, otherwise unremarkable: the target
//                         just isn't built to sit on information, no malice
//                         in it. Moderate bond hit; thread advances instead
//                         of closing, because the leak is now itself a
//                         live fact the tester has to manage.
//   REPEATED-MALICIOUSLY — high strategic + low loyalty: the target used
//                         the "secret" as currency. Heavy bond damage, and
//                         the thread closes with an outcome that marks the
//                         target as an active risk, not just a leaky one.
//   CAUGHT-THE-TEST       — high intuition: the target clocks that they
//                         were being tested and says so, outright. Damages
//                         the TESTER's own credibility instead of the
//                         target's — a genuinely different kind of failure,
//                         with the bond hit landing on the tester's side of
//                         the ledger via a small negative to the actor
//                         (modeled as a symmetric bond change, since the
//                         only bond value this engine tracks is symmetric,
//                         but the residue explicitly says whose failure it
//                         was).
const DECOY_LINES = {
  keptQuiet: [
    '{a} planted a fake secret with {b} and it never went anywhere. Not a whisper.',
    '{b} sat on the planted secret completely. It was a clean pass.',
    '{a} waited two days for the fake to surface somewhere. It never did.',
    '{b} was told something worth telling and told nobody, and did not once mention not telling.',
    '{a} left it two days and then three, and it is still exactly where {a} put it.',
    'Not one person in this castle has heard it, and {a} has checked with four of them.',
    '{b} is either extremely trustworthy or extremely careful, and {a} cannot tell which.',
    'It went in and it did not come out. That is the whole of the result and it is a good one.',
    '{a} even gave {b} an opening to mention it, twice, and {b} did not take either.',
    'Whatever else {b} is, {b} is a person who can be told something.',
  ],
  innocent: [
    '{b} repeated the planted secret to somebody else within the day — no malice, just couldn\'t help it.',
    'The fake secret got out through {b}, and {b} clearly hadn\'t meant for it to.',
    '{b} told one person, in confidence, who told one person, in confidence, and {a} heard it back by evening.',
    'It came back to {a} with {b}\'s phrasing still on it, which was answer enough.',
    '{b} told it as a worry rather than as a weapon, which is somehow worse for {b}.',
    'It got out inside four hours and {b} has no idea it got out at all.',
    '{a} heard it back at supper from somebody who had it from somebody who had it from {b}.',
    '{b} prefaced it with “do not repeat this”, which is how {a} knew exactly where it came from.',
    'It leaked the way water leaks, gradually and without anybody deciding to.',
    '{b} is not malicious. {b} is simply not a place a thing can be kept.',
  ],
  malicious: [
    '{b} took the planted secret and spent it deliberately, for something they wanted.',
    '{b} traded {a}\'s "secret" for leverage the moment it was useful.',
    '{b} did not just repeat it. {b} improved it, and aimed the improved version at somebody.',
    '{a} watched {b} sell it, knowingly, to the person it would do the most damage with.',
    '{b} held it for a day and a half, waiting for the right room, and then used it in the right room.',
    'It was not repeated. It was deployed, and {a} watched the deploying.',
    '{b} attached a name to it that {a} had never mentioned, which is the part that will cost.',
    '{b} got something real for a thing that was not real, which is good work by any standard.',
    '{a} learned exactly what {b} does with a gift, and it was not a cheap lesson to arrange.',
    '{b} spent it, and made sure the person {b} spent it on knew who it had come from.',
  ],
  caughtTest: [
    '{b} looked {a} dead in the eye and said "you\'re testing me, aren\'t you?" — and {a} had no good answer.',
    '{b} saw straight through the plant, and made sure {a} knew they had.',
    '{b} repeated the fake secret back to {a}, word perfect, with an eyebrow up.',
    '"That\'s not true," {b} said, pleasantly, "and you know it isn\'t." {a} did know it.',
    '{b} asked {a} which part {a} had made up, and waited, and {a} did not answer.',
    '{b} has been on the receiving end of this before, from somebody better at it.',
    '“If you want to know something, ask me,” said {b}, which ended the arrangement entirely.',
    '{b} named the test, named the day {a} had started running them, and went to bed.',
    'It took {b} about four seconds and {a} spent the rest of the evening on those four seconds.',
    '{b} did not mind being tested. {b} minded being tested badly, and said so.',
  ],
};

registerEvent({
  id: 'testing-decoy-secret',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['intuition', 'loyalty', 'social', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-decoy-secret');
    const sceneWhy = 'planted a secret to see where it travelled';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const keptScore = (st.loyalty / 10) * 0.5 + (st.temperament / 10) * 0.3 + 0.1;
    const innocentScore = (st.social / 10) * 0.5 + 0.15;
    const maliciousScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.4;
    const caughtScore = (st.intuition / 10) * 0.6;
    const total = keptScore + innocentScore + maliciousScore + caughtScore;
    const roll = rng() * total;
    let branch;
    if (roll < keptScore) branch = 'keptQuiet';
    else if (roll < keptScore + innocentScore) branch = 'innocent';
    else if (roll < keptScore + innocentScore + maliciousScore) branch = 'malicious';
    else branch = 'caughtTest';

    const line = pick(rng, DECOY_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const existing = findOpenThread(FAMILY, [a, b]);
    let bondDelta;
    let threadId;
    if (branch === 'keptQuiet') {
      bondDelta = 2;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'passed-clean', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    } else if (branch === 'innocent') {
      bondDelta = -1;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
      threadId = t?.id;
    } else if (branch === 'malicious') {
      bondDelta = -3;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'failed-maliciously', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    } else {
      bondDelta = -1;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'test-exposed', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    }
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId, bondDelta };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// The last check of the day, and the one that ends the probe. A test that is
// never scored is not a test, and until this event the only place a testing
// thread could be RESOLVED was `testing-decoy-secret` in evening - one event,
// in the pool's most crowded window, behind a 5-episode pair cooldown.

const NIGHT_CHECK_LINES = {
  confirmed: [
    '{a} went back over what they had asked {b} and what {b} had done about it, and it came out clean.',
    'Before sleeping {a} put the whole test back together in their head, and {b} passed it twice.',
    '{a} had been waiting all day for the thing that would prove them wrong about {b}, and it never arrived.',
    '{a} could not find the seam, and went to sleep having decided that meant there was not one.',
    'Three passes over one afternoon and every one of them came out the same way.',
    '{a} went looking for the lie at midnight and found an ordinary day instead.',
    'Whatever {a} had been braced for, {b} did not do it, and {a} slept better for it.',
    '{a} had built a case out of a feeling and the feeling did not survive being written down.',
    'It held up in every order {a} put it in, and {a} put it in four.',
    '{a} decided, at about one in the morning, to stop testing {b} for a while.',
  ],
  failed: [
    '{a} laid the day out before sleeping and found the exact place {b} had failed it.',
    'It took until lights-out for {a} to see it, and then it was the only thing {a} could see.',
    '{a} worked out what {b} had actually done with it, and stopped pretending otherwise.',
    'One sentence from the afternoon came back to {a} at midnight with a different meaning on it.',
    '{a} found the hour where {b} had been somewhere {b} had not mentioned being.',
    'It was the smallest possible thing and it was the wrong way round, and {a} could not unsee it.',
    '{a} put the day in order at midnight and one piece would not go anywhere it fitted.',
    'The test had a right answer and {b} had given the other one, four hours ago, in passing.',
    '{a} lay there working out how long {b} had been doing that, and got a longer answer than expected.',
    'Everything else about the day was fine, which is what made the one thing so loud.',
  ],
  inconclusive: [
    '{a} could not make the day prove anything about {b} either way, and it kept them up.',
    'The test came back neither one thing nor the other, and {a} hated that more than a failure.',
    '{a} ran it back three times before sleeping and still had nothing to show for it.',
    'Every reading of it worked. That was the problem, and {a} knew it was the problem.',
    '{a} wanted a verdict and got a shrug, from a day {a} had spent designing.',
    'There is an innocent explanation and a guilty one and they fit equally well, which is intolerable.',
    '{a} could argue it either way and did, twice, out loud, to the ceiling.',
    'The test was a good test. The answer is a coin, and {a} designed a coin by accident.',
    '{a} went to sleep knowing exactly as much about {b} as at breakfast.',
    'It refuses to resolve, and {a} has now spent two nights on a thing that refuses to resolve.',
  ],
  'misread': [
    '{a} came out of the night certain about {b}, and certain the wrong way.',
    'The test gave {a} a clean answer about {b}. It was the wrong answer, and {a} has no way to know that.',
    '{a} read it, called it, and built the rest of the week on a conclusion that will not hold.',
    'Everything {a} thinks about {b} from here rests on one night that {a} got backwards.',
    '{b} passed something {b} should have failed, or failed something {b} should have passed, and only the castle will find out which.',
    '{a} is more confident about {b} this morning than the evidence deserves.',
    'It looked conclusive. That is the most dangerous thing a night in this castle can look.',
    '{a} has stopped asking questions about {b}, which is exactly what {b} needed.',
  ],
};

registerEvent({
  id: 'testing-night-scores-it',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'loyalty', 'mental', 'temperament'],
    knowledge: ['tested-before', 'first-test'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread(FAMILY, ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-night-scores-it');
    const sceneWhy = 'the night settled what the test proved';
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // TWO PEOPLE'S STATS, because a test result is a joint fact: whether the
    // tested player held (loyalty, temperament) AND whether the tester was
    // sharp enough to read what they saw (mental, intuition).
    const passScore = (sb.loyalty / 10) * 0.5 + (sb.temperament / 10) * 0.4;
    const failScore = (1 - sb.loyalty / 10) * 0.5 + (sa.intuition / 10) * 0.4;
    const noneScore = (1 - sa.mental / 10) * 0.6 + 0.2;
    // A FOURTH RESULT, and it is the one the other three cannot express: a
    // CONFIDENT WRONG READ. `inconclusive` is the tester getting no answer;
    // this is the tester getting an answer and it being false, which is a
    // different and more dangerous thing to carry into a week. Low intuition
    // with high confidence -- the corner `noneScore` (low mental) misses.
    const misreadScore = (1 - sa.intuition / 10) * 0.4 + (sb.social / 10) * 0.25;
    const total = passScore + failScore + noneScore + misreadScore;
    const roll = rng() * total;
    let branch;
    if (roll < passScore) branch = 'confirmed';
    else if (roll < passScore + failScore) branch = 'failed';
    else if (roll < passScore + failScore + noneScore) branch = 'inconclusive';
    else branch = 'misread';

    const line = pick(rng, NIGHT_CHECK_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread(FAMILY, [a, b]);
    // A misread warms the bond exactly as a pass would, because {a} believes
    // it was a pass. That is the whole cost of the branch.
    const bondDelta = branch === 'confirmed' ? 2 : branch === 'misread' ? 1.5
      : branch === 'failed' ? -2.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    const outcome = branch === 'confirmed' ? 'passed-clean'
      : branch === 'failed' ? 'failed-maliciously' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread.id, cited, note, outcome, bondDelta };
  },
});
