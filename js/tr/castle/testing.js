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
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { lineFor } from './lines.js';
import { openThread, advanceThread, closeThread, findOpenThread, continueThread,
  advanceCiting } from '../threads.js';

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
  ],
  bad: [
    '{a} quietly cross-checked {b}\'s story with a third person. It didn\'t quite match.',
    '{a} asked somebody else where {b} had been, and got a different room.',
    'The times were nearly right. Nearly was the problem, and {a} noticed it.',
    '{b}\'s version had one person in it who did not remember being there, and {a} had asked them first.',
    'Somebody else put {b} somewhere {b} had not mentioned, and {a} did not point that out.',
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
};

const HYPOTHETICAL_LINES = {
  reassured: [
    '{a} asked {b} what they\'d do if {a} got banished next. {b}\'s answer landed as sincere.',
    '"If it\'s me tomorrow," said {a}, and {b} answered the whole question, properly.',
    '{a} put the worst version of tomorrow to {b}, and {b} did not flinch from it.',
    '{b} told {a} exactly who they would go after, and it was believable.',
  ],
  hedged: [
    '{a} asked {b} what they\'d do if {a} got banished next. {b} hedged, and {a} noticed the hedge.',
    '{a} asked a direct question about tomorrow and got a paragraph about today.',
    '{b} said it would not come to that, twice, and did not say what they would do if it did.',
    '{b} answered around the edges of it, and {a} let them, and remembered.',
  ],
};

const DOUBLE_CHECK_LINES = {
  consistent: [
    '{a} asked {b} to walk through their morning again. It matched, word for word.',
    '{a} made {b} tell it a second time and it came out the same, including the boring parts.',
    'Second telling, same order, same details. {a} had been hoping for otherwise.',
    '{b} retold it with a shrug and got every hour of it right.',
    '{a} asked for it again out of order and {b} reassembled it without a wobble.',
  ],
  inconsistent: [
    '{a} asked {b} to walk through their morning again, and it came out different the second time.',
    'The second version had a room in it the first version did not, and {a} caught it.',
    '{b} moved half an hour around between the two tellings and did not notice doing it.',
    '{a} asked again and got a tidier story, which is worse than a messier one.',
    'The second version was missing the one detail {a} had actually been listening for.',
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

const COLD_READ_LINES = [
  '{a} dropped a leading line about {c} into the conversation, purely to watch what crossed {b}\'s face.',
  '{a} said something almost true about {c} and spent the whole sentence watching {b} instead.',
  '{a} put {c}\'s name down in front of {b} like a card, face up, and waited.',
  '{a} pretended to have heard something about {c}. {b}\'s reaction was the information {a} was after.',
  '{a} mentioned {c} in the wrong context on purpose, and read {b} instead of listening to them.',
];

const FOLLOW_THROUGH_LINES = [
  '{a} kept quietly checking whether {b} was still holding up to whatever they\'d been asked before.',
  '{a} never said the word out loud again, and went on checking every day that {b} was keeping it.',
  '{b} did not know they were still being marked. {a} was still marking.',
  '{a} looked for the day {b} would let it slip, and it had not been today either.',
  'It had been asked once and never repeated, and {a} was watching the answer hold.',
];


registerEvent({
  id: 'testing-small-dare',
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
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const compliant = rng() < Math.max(0.1, Math.min(0.9, st.loyalty / 10));
    const bondDelta = compliant ? 0.5 : -0.5;
    addBond(a, b, bondDelta);
    const line = lineFor(DARE_LINES[compliant ? 'complied' : 'refused'],
      `testing-small-dare|${ctx.ep}|${compliant}`, { a, b });
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: compliant ? 'complied' : 'refused', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-ask-for-alibi-check',
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
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const checksOut = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10));
    const bondDelta = checksOut ? 0.5 : -1;
    addBond(a, b, bondDelta);
    const line = lineFor(ALIBI_CHECK_LINES[checksOut ? 'ok' : 'bad'],
      `testing-ask-for-alibi-check|${ctx.ep}|${checksOut}`, { a, b });
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: checksOut ? 'checks-out' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-loyalty-oath',
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
    if (bondDelta) addBond(a, b, bondDelta);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
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
  family: FAMILY,
  window: 'after-table',
  // ACT: TESTING. Baiting somebody to watch their face is a mid-season move:
  // early there is nothing to bait them about, late the room is too small for
  // a test this indirect to stay private.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const staysCalm = rng() < Math.max(0.1, Math.min(0.9, st.temperament / 10));
    const bondDelta = staysCalm ? 0.5 : -1;
    addBond(a, b, bondDelta);
    const line = lineFor(REVERSE_PSYCH_LINES[staysCalm ? 'calm' : 'rattled'],
      `testing-reverse-psychology|${ctx.ep}|${staysCalm}`, { a, b });
    const t = openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: staysCalm ? 'stayed-calm' : 'got-rattled', pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'testing-hypothetical-loyalty-question',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const reassures = rng() < Math.max(0.15, Math.min(0.9, st.loyalty / 10));
    const bondDelta = reassures ? 1 : -0.5;
    addBond(a, b, bondDelta);
    const line = lineFor(HYPOTHETICAL_LINES[reassures ? 'reassured' : 'hedged'],
      `testing-hypothetical-loyalty-question|${ctx.ep}|${reassures}`, { a, b });
    const t = openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: reassures ? 'reassured' : 'hedged', pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'testing-double-check-story',
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
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const consistent = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10 * 0.6 + 0.3));
    const bondDelta = consistent ? 0 : -1;
    if (bondDelta) addBond(a, b, bondDelta);
    const line = lineFor(DOUBLE_CHECK_LINES[consistent ? 'consistent' : 'inconsistent'],
      `testing-double-check-story|${ctx.ep}|${consistent}`, { a, b });
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: consistent ? 'consistent' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-silence-test',
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
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const chases = rng() < Math.max(0.1, Math.min(0.9, st.social / 10 * 0.5 + st.loyalty / 10 * 0.4));
    const bondDelta = chases ? 1 : -1;
    addBond(a, b, bondDelta);
    const line = lineFor(SILENCE_LINES[chases ? 'chased' : 'letgo'],
      `testing-silence-test|${ctx.ep}|${chases}`, { a, b });
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: chases ? 'chased' : 'let-it-go', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-cold-read-check',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 7 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(COLD_READ_LINES, `testing-cold-read-check|${ctx.ep}`, { a, b, c: target }));
    addBond(a, b, 0);
    return { branch: 'cold-read', pair: [a, b], target, threadId: t?.id };
  },
});

registerEvent({
  id: 'testing-follow-through-check',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // CITES (Plan 5 Task 2). "Whatever they'd been asked before" is a sentence
  // with a hole in it where the day should be.
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    addBond(a, b, 0.5);
    const { thread, cited } = advanceCiting(t, ctx.ep,
      lineFor(FOLLOW_THROUGH_LINES, `testing-follow-through-check|${ctx.ep}`, { a, b }));
    return { branch: 'followed-through', pair: [a, b], threadId: thread?.id, cited, bondDelta: 0.5 };
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
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
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
      addBond(a, b, bondDelta);
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        advanceThread(existing.id, ctx.ep, line);
        closeThread(existing.id, ctx.ep, 'passed-clean');
        threadId = existing.id;
      } else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    } else if (branch === 'innocent') {
      bondDelta = -1;
      addBond(a, b, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
      threadId = t?.id;
    } else if (branch === 'malicious') {
      bondDelta = -3;
      addBond(a, b, bondDelta);
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        advanceThread(existing.id, ctx.ep, line);
        closeThread(existing.id, ctx.ep, 'failed-maliciously');
        threadId = existing.id;
      } else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    } else {
      bondDelta = -1;
      addBond(a, b, bondDelta);
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        advanceThread(existing.id, ctx.ep, line);
        closeThread(existing.id, ctx.ep, 'test-exposed');
        threadId = existing.id;
      } else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
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
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread(FAMILY, ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
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
    if (bondDelta) addBond(a, b, bondDelta);
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    const outcome = branch === 'confirmed' ? 'passed-clean'
      : branch === 'failed' ? 'failed-maliciously' : null;
    if (outcome) closeThread(thread.id, ctx.ep, outcome);
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});
