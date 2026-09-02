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
import { findOpenThread } from '../threads.js';

const FAMILY = 'testing';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Line pools chosen by hash, not by rng — see lines.js for why a `pick()`
// added to an event that did not already have one reroutes the season.
const DARE_LINES = {
  complied: [
    '{a} floated a small, pointless ask, and {b} just went along with it — no questions.',
    '{a} asked {b} for something trivial and slightly odd, and {b} did it without breaking stride.',
    '{b} swapped seats because {a} asked them to, and never asked why.',
    '{a} tested it with something that did not matter at all, and {b} passed without noticing there had been a test.',
  ],
  refused: [
    '{a} floated a small, pointless ask, and {b} pushed back on it, which told {a} something.',
    '{b} wanted to know why before doing a thing that took four seconds, and {a} filed that.',
    '{a} asked for nothing much and {b} said no to it, pleasantly, and completely.',
    '{b} laughed and did not move, and the not moving was the answer {a} came for.',
  ],
};

const ALIBI_CHECK_LINES = {
  ok: [
    '{a} quietly cross-checked {b}\'s story with a third person. It matched, clean.',
    '{a} took {b}\'s account to somebody else and came back with nothing to worry about.',
    'Two people put {b} in the same place at the same time, and {a} had asked them separately.',
    '{a} went looking for a hole in {b}\'s evening and did not find one.',
    '{a} asked around about {b} without ever saying they were asking, and everything came back fine.',
    'Two separate accounts of {b}’s evening, both dull, both the same, and {a} believed both.',
    '{a} took the long way round to check {b} and got the boring answer at the end of it.',
    'There was nothing to find. {a} looked properly and there was nothing to find.',
    'Somebody put {b} exactly where {b} had said, without being told what {b} had said.',
    '{a} came back from checking {b} slightly disappointed and rather more comfortable.',
    'The account survived a person who wanted it not to, which is the strongest kind there is.',
  ],
  bad: [
    '{a} quietly cross-checked {b}\'s story with a third person. It didn\'t quite match.',
    '{a} asked somebody else where {b} had been, and got a different room.',
    'The times were nearly right. Nearly was the problem, and {a} noticed it.',
    '{b}\'s version had one person in it who did not remember being there, and {a} had asked them first.',
    'Somebody else put {b} somewhere {b} had not mentioned, and {a} did not point that out.',
    'The two accounts of {b}’s evening agreed about everything except the part {a} cared about.',
    '{a} got a different room out of the third person and kept both rooms.',
    'It was a small gap. {a} has learned that they are all small gaps.',
    'Nobody could put {b} anywhere for about forty minutes, and {b} had been very specific about those forty minutes.',
    '{a} asked twice, in two different ways, and got two different evenings.',
    'The third person hesitated before answering about {b}, and {a} counted the hesitation as well.',
  ],
};

const OATH_LINES = {
  sincere: [
    '{a} asked {b} to commit to it in front of the room, and {b} did, without hesitating.',
    '{a} put the question publicly and {b} answered it publicly, straight away, and meant it.',
    '{b} said yes before {a} had finished asking, in front of everybody.',
    '{a} wanted it said out loud where witnesses were, and {b} said it out loud.',
  ],
  reluctant: [
    '{b} said what {a} wanted to hear, but it took visible effort to get there.',
    '{b} got to the right answer the long way round, and the room watched the whole route.',
    '{a} got the commitment. {a} also got a pause before it that everybody heard.',
    '{b} agreed, eventually, in a voice that was doing something other than agreeing.',
  ],
  refuses: [
    '{b} flatly refused to make the commitment {a} was asking for, publicly.',
    '{b} said they were not going to promise anybody anything, and said it to the room, not to {a}.',
    '{a} asked for a promise and got a lecture about promises.',
    '{b} would not say the words, and did not pretend to be sorry about it.',
  ],
};

const REVERSE_PSYCH_LINES = {
  calm: [
    '{a} pretended to distrust {b} just to see the reaction. {b} just laughed it off.',
    '{a} accused {b} of something they did not believe, and {b} agreed with them cheerfully.',
    '{a} baited {b}, badly on purpose, and {b} took it exactly as seriously as it deserved.',
    '{b} saw it coming, said so, and made {a} say what they were actually after.',
  ],
  rattled: [
    '{a} pretended to distrust {b} just to see the reaction, and {b} got visibly rattled.',
    '{a} said something they did not mean and {b} spent ten minutes answering it.',
    'It was not a real accusation. {b} defended themselves from it like it was.',
    '{b}\'s face did the whole thing before {b}\'s mouth caught up, and {a} watched both.',
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
    'It stopped being a test somewhere in the middle, and it was {b} who decided when.',
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
    'It stopped being a test about halfway through and turned into two people testing each other.',
  ],
  'made-a-condition': [
    '{b} said yes, and then said what it would take, and {a} had not expected a price.',
    '"I would," {b} said. "If you’d told me about the other thing first." {a} took that in.',
    '{b} answered {a}’s hypothetical with a real one, and there were terms in it.',
    '{a} got a commitment out of {b} with a condition bolted onto the end of it.',
    '{b} would do it. {b} named exactly what {a} would owe for it, out loud, without embarrassment.',
    'It was not a no. It was a yes with a number attached, and {a} spent the evening on the number.',
  ],
};

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
};

const SILENCE_LINES = {
  chased: [
    '{a} went quiet on purpose to see if {b} would chase it. {b} did, almost immediately.',
    '{a} stopped talking mid-thought, and {b} could not leave it there.',
    '{a} let the silence run, and {b} filled it, twice.',
    '{b} came and found {a} an hour later to finish the sentence {a} had abandoned.',
  ],
  letgo: [
    '{a} went quiet on purpose to see if {b} would chase it. {b} let it be quiet right back.',
    '{a} left a gap. {b} sat in it comfortably and said nothing at all.',
    '{a} was waiting to be asked. {b} did not ask, and it was a long morning.',
    '{b} matched the silence exactly, which told {a} either a great deal or nothing.',
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
    '{a} did the read on {b} about {c} and then, rather than keep it, told {b} what {a} had just done.',
    '"I was watching you, just then," {a} admitted, which is not how this is supposed to work.',
    '{a} got the information and immediately handed it back, because {a} could not do the other thing to {b}.',
    '{a} explained the trick to {b} halfway through performing it, and both of them found that funny.',
    '{a} said {c}’s name to read {b} and then told {b} that was why, and {b} respected it.',
    'It stopped being a test the moment {a} said out loud that it was one, and {a} said so on purpose.',
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-small-dare');
    const sceneWhy = 'set a small test to see if it would be taken';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const compliant = rng() < Math.max(0.1, Math.min(0.9, st.loyalty / 10));
    const bondDelta = compliant ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DARE_LINES[compliant ? 'complied' : 'refused'],
      `testing-small-dare|${ctx.ep}|${compliant}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch: compliant ? 'complied' : 'refused', pair: [a, b], threadId: thread?.id, cited, bondDelta };
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-ask-for-alibi-check');
    const sceneWhy = 'took somebody\'s account of the night to a third party';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const checksOut = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10));
    const bondDelta = checksOut ? 0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(ALIBI_CHECK_LINES[checksOut ? 'ok' : 'bad'],
      `testing-ask-for-alibi-check|${ctx.ep}|${checksOut}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch: checksOut ? 'checks-out' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-loyalty-oath',
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
    const total = sincereScore + reluctantScore + refusesScore;
    const roll = rng() * total;
    let branch;
    if (roll < sincereScore) branch = 'sincere';
    else if (roll < sincereScore + reluctantScore) branch = 'reluctant';
    else branch = 'refuses';

    const line = lineFor(OATH_LINES[branch], `testing-loyalty-oath|${ctx.ep}|${branch}`, { a, b });
    const bondDelta = branch === 'sincere' ? 2 : branch === 'reluctant' ? 0 : -2;
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
    return { branch, pair: [a, b], threadId: t?.id, bondDelta,
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
    return { branch, pair: [a, b], speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
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
    return { branch, pair: [a, b], speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-double-check-story');
    const sceneWhy = 'checked one account against another';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const consistent = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10 * 0.6 + 0.3));
    const bondDelta = consistent ? 0 : -1;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DOUBLE_CHECK_LINES[consistent ? 'consistent' : 'inconsistent'],
      `testing-double-check-story|${ctx.ep}|${consistent}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch: consistent ? 'consistent' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-silence-test');
    const sceneWhy = 'left a silence to see who filled it';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const chases = rng() < Math.max(0.1, Math.min(0.9, st.social / 10 * 0.5 + st.loyalty / 10 * 0.4));
    const bondDelta = chases ? 1 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(SILENCE_LINES[chases ? 'chased' : 'letgo'],
      `testing-silence-test|${ctx.ep}|${chases}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch: chases ? 'chased' : 'let-it-go', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  // ── REWRITE (Task 7 stage 5) ────────────────────────────────────────
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
    return { branch, pair: [a, b], speaker: a, respondent: b, target,
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
    return { branch, pair: [a, b], speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
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
  ],
  innocent: [
    '{b} repeated the planted secret to somebody else within the day — no malice, just couldn\'t help it.',
    'The fake secret got out through {b}, and {b} clearly hadn\'t meant for it to.',
    '{b} told one person, in confidence, who told one person, in confidence, and {a} heard it back by evening.',
    'It came back to {a} with {b}\'s phrasing still on it, which was answer enough.',
  ],
  malicious: [
    '{b} took the planted secret and spent it deliberately, for something they wanted.',
    '{b} traded {a}\'s "secret" for leverage the moment it was useful.',
    '{b} did not just repeat it. {b} improved it, and aimed the improved version at somebody.',
    '{a} watched {b} sell it, knowingly, to the person it would do the most damage with.',
  ],
  caughtTest: [
    '{b} looked {a} dead in the eye and said "you\'re testing me, aren\'t you?" — and {a} had no good answer.',
    '{b} saw straight through the plant, and made sure {a} knew they had.',
    '{b} repeated the fake secret back to {a}, word perfect, with an eyebrow up.',
    '"That\'s not true," {b} said, pleasantly, "and you know it isn\'t." {a} did know it.',
  ],
};

registerEvent({
  id: 'testing-decoy-secret',
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
    return { branch, pair: [a, b], threadId, bondDelta };
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
  ],
  failed: [
    '{a} laid the day out before sleeping and found the exact place {b} had failed it.',
    'It took until lights-out for {a} to see it, and then it was the only thing {a} could see.',
    '{a} worked out what {b} had actually done with it, and stopped pretending otherwise.',
    'One sentence from the afternoon came back to {a} at midnight with a different meaning on it.',
  ],
  inconclusive: [
    '{a} could not make the day prove anything about {b} either way, and it kept them up.',
    'The test came back neither one thing nor the other, and {a} hated that more than a failure.',
    '{a} ran it back three times before sleeping and still had nothing to show for it.',
    'Every reading of it worked. That was the problem, and {a} knew it was the problem.',
  ],
};

registerEvent({
  id: 'testing-night-scores-it',
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
    const total = passScore + failScore + noneScore;
    const roll = rng() * total;
    let branch;
    if (roll < passScore) branch = 'confirmed';
    else if (roll < passScore + failScore) branch = 'failed';
    else branch = 'inconclusive';

    const line = pick(rng, NIGHT_CHECK_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread(FAMILY, [a, b]);
    const bondDelta = branch === 'confirmed' ? 2 : branch === 'failed' ? -2.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    const outcome = branch === 'confirmed' ? 'passed-clean'
      : branch === 'failed' ? 'failed-maliciously' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});
